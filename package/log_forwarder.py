import json
import base64
import gzip
import os
from opensearchpy import OpenSearch, RequestsHttpConnection

# Retrieve environment variables for OpenSearch connection.
OPENSEARCH_HOST = os.getenv("OPENSEARCH_HOST", "http://34.55.93.158:9200")
OPENSEARCH_USER = os.getenv("OPENSEARCH_USER", "")
OPENSEARCH_PASS = os.getenv("OPENSEARCH_PASS", "")

# Create the OpenSearch client.
client = OpenSearch(
    hosts=[OPENSEARCH_HOST],
    http_auth=(OPENSEARCH_USER, OPENSEARCH_PASS) if OPENSEARCH_USER and OPENSEARCH_PASS else None,
    use_ssl=False,
    verify_certs=False,
    connection_class=RequestsHttpConnection
)

# Define the prefix for structured logs.
LOG_PREFIX = "API_LOG::"

def lambda_handler(event, context):
    """
    Lambda function to process CloudWatch Log events:
    - Decodes the base64-encoded, gzipped payload.
    - Parses the JSON structure to retrieve individual log events.
    - Filters messages starting with our log prefix.
    - Indexes the structured log into OpenSearch.
    """
    output = []
    print("Log Forwarder Called")
    print("Event Received:", json.dumps(event))

    try:
        # Step 1: Get the base64-encoded data from the event.
        awslogs_data = event["awslogs"]["data"]
        
        # Step 2: Decode the base64 string.
        compressed_payload = base64.b64decode(awslogs_data)
        print("Compressed: ", compressed_payload)
        # Step 3: Decompress the gzipped data.
        decompressed_payload = gzip.decompress(compressed_payload).decode("utf-8")
        print("Decompressed: ", decompressed_payload)
        # Step 4: Parse the JSON. This JSON should have a structure with a "logEvents" key.
        logs_data = json.loads(decompressed_payload)
        log_events = logs_data.get("logEvents", [])
        print("Log Events: ", log_events)
        
    except Exception as e:
        print("Error decoding CloudWatch Logs payload:", str(e))
        return {"records": [{"result": "Error", "error": str(e)}]}
    
    # Process each log event.
    for record in log_events:
        print("Processing record:", record)
        try:
            message = record.get("message", "")
            
            # Process only those logs with our designated prefix.
            if message.startswith(LOG_PREFIX):
                print("Message with prefix intercepted")
                # Strip the prefix and parse the JSON that follows.
                structured_log = json.loads(message[len(LOG_PREFIX):])
                
                # Optionally, include the ingestion timestamp from the log record.
                structured_log["ingested_at"] = record.get("timestamp", None)
                
                # Index the structured log into OpenSearch (into an index called "api-logs")
                index_response = client.index(index="api-logs", body=structured_log)
                print("Content Sent to OpenSearch:", index_response)
                output.append({
                    "recordId": record.get("id", "unknown"),
                    "result": "Ok",
                    "opensearch_response": index_response
                })
            else:
                # If the log event doesn't have the prefix, mark it as dropped.
                output.append({
                    "recordId": record.get("id", "unknown"),
                    "result": "Dropped"
                })
        except Exception as e:
            print("Error processing record {}: {}".format(record.get("id", "unknown"), str(e)))
            output.append({
                "recordId": record.get("id", "unknown"),
                "result": "Error",
                "error": str(e)
            })
    
    # Return a report; CloudWatch Logs expects a response with record statuses.
    return {"records": output}
