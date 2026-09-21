import os
import boto3
from dotenv import load_dotenv

load_dotenv()

AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME")

if not S3_BUCKET_NAME:
    raise RuntimeError("S3_BUCKET_NAME is not configured")

s3_client = boto3.client(
    "s3",
    region_name=AWS_REGION,
)


def upload_file(
    file_bytes: bytes,
    object_key: str,
    content_type: str = "application/pdf",
):
    s3_client.put_object(
        Bucket=S3_BUCKET_NAME,
        Key=object_key,
        Body=file_bytes,
        ContentType=content_type,
    )


def get_file(object_key: str) -> bytes:
    response = s3_client.get_object(
        Bucket=S3_BUCKET_NAME,
        Key=object_key,
    )

    return response["Body"].read()


def delete_file(object_key: str):
    s3_client.delete_object(
        Bucket=S3_BUCKET_NAME,
        Key=object_key,
    )



if __name__ == "__main__":
    test_key = "test/sourcelearn-test.txt"

    upload_file(
        b"Hello from SourceLearn!",
        test_key,
        content_type="text/plain",
    )

    data = get_file(test_key)
    print(data.decode())

    delete_file(test_key)