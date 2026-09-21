import json
import pytest
from unittest.mock import MagicMock, patch
from app.schemas.question import AnswerResponse
from app.services.llm_service import (
    is_likely_followup,
    condense_query,
    generate_answer,
    _call_with_retry,
)


def test_is_likely_followup():
    # Standalone queries (should return False)
    assert not is_likely_followup("What is virtual memory in computer architecture?")
    assert not is_likely_followup("Explain the concept of convolutional neural networks")

    # Very short questions (<= 4 words, should return True)
    assert is_likely_followup("Why?")
    assert is_likely_followup("How so?")
    assert is_likely_followup("Can you elaborate?")

    # Starter phrases (should return True)
    assert is_likely_followup("What about the second method?")
    assert is_likely_followup("Tell me more about page tables")
    assert is_likely_followup("Give an example of this algorithm")

    # Contextual pronouns / indicators (should return True)
    assert is_likely_followup("Does it support multitasking?")
    assert is_likely_followup("What was the previous approach?")
    assert is_likely_followup("Why does that happen in kernels?")


def test_condense_query_bypasses_llm_for_standalone():
    # If no chat history or not a follow up, should return question directly with ZERO LLM calls
    with patch("app.services.llm_service.client") as mock_client:
        q = "What is virtual memory in computer architecture?"
        res = condense_query(q, chat_history=[])
        assert res == q
        mock_client.models.generate_content.assert_not_called()

        res2 = condense_query(q, chat_history=[{"role": "user", "content": "hello"}])
        assert res2 == q
        mock_client.models.generate_content.assert_not_called()


def test_condense_query_calls_llm_for_followup():
    with patch("app.services.llm_service.client") as mock_client:
        mock_response = MagicMock()
        mock_response.text = "How does virtual memory paging work?"
        mock_client.models.generate_content.return_value = mock_response

        history = [
            {"role": "user", "content": "What is virtual memory?"},
            {"role": "assistant", "content": "Virtual memory provides private address spaces using paging."},
        ]
        res = condense_query("How does that work?", chat_history=history)

        assert res == "How does virtual memory paging work?"
        mock_client.models.generate_content.assert_called_once()


def test_condense_query_fallback_on_error():
    with patch("app.services.llm_service.client") as mock_client:
        mock_client.models.generate_content.side_effect = Exception("API error")

        history = [{"role": "user", "content": "Tell me about OS"}]
        res = condense_query("Why is that?", chat_history=history)

        # Fallback to original question
        assert res == "Why is that?"


def test_generate_answer_empty_chunks():
    with patch("app.services.llm_service.client") as mock_client:
        result_json = generate_answer("What is this?", chunks=[])
        mock_client.models.generate_content.assert_not_called()

        parsed = AnswerResponse.model_validate_json(result_json)
        assert "not contain enough information" in parsed.answer
        assert parsed.citations == []


def test_generate_answer_with_chunks():
    with patch("app.services.llm_service.client") as mock_client:
        mock_response = MagicMock()
        mock_response.text = json.dumps({
            "answer": "Virtual memory maps virtual pages to physical frames [42].",
            "citations": [42]
        })
        mock_client.models.generate_content.return_value = mock_response

        chunk_mock = MagicMock()
        chunk_mock.id = 42
        chunk_mock.page_number = 3
        chunk_mock.text = "Virtual memory uses page tables to map virtual pages to frames."

        result_json = generate_answer(
            question="How does virtual memory work?",
            chunks=[chunk_mock],
            chat_history=[{"role": "user", "content": "Hi"}],
        )

        mock_client.models.generate_content.assert_called_once()
        parsed = AnswerResponse.model_validate_json(result_json)
        assert parsed.citations == [42]
        assert "[42]" in parsed.answer


def test_call_with_retry_success():
    mock_fn = MagicMock(return_value="ok")
    assert _call_with_retry(mock_fn, max_retries=2) == "ok"
    assert mock_fn.call_count == 1

