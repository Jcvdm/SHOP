$data = @{
    intent = "pre-edit-gathering"
    limit = 10
    maxTokens = 3000
    query = "inspection service client type insurance private literal union"
    strategy = "auto"
}
$body = $data | ConvertTo-Json -Depth 10
curl.exe -s -X POST http://localhost:3457/api/context -H "Content-Type: application/json" -d "$body"
