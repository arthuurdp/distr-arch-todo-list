# Rate limit demo: fires login attempts through the gateway and counts how many reach the API and how many
# the gateway rejects with 429. The login route allows 10 requests/minute per IP with a burst of 5.
# Usage: .\scripts\rate-limit-demo.ps1 [-Total 15] [-BaseUrl http://localhost:8080]
param(
    [int]$Total = 15,
    [string]$BaseUrl = "http://localhost:8080"
)

$body = '{"email": "test@gmail.com", "password": "WrongPassword1!"}'
$passed = 0
$limited = 0

for ($i = 1; $i -le $Total; $i++) {
    try {
        $status = (Invoke-WebRequest -Method Post -Uri "$BaseUrl/api/auth/login" -ContentType "application/json" `
            -Body $body -UseBasicParsing).StatusCode
    } catch {
        $status = [int]$_.Exception.Response.StatusCode
    }

    if ($status -eq 429) {
        $limited++
        $label = "bloqueada pelo gateway"
    } else {
        $passed++
        $label = "chegou na API"
    }
    Write-Output ("#{0,-2} -> {1} ({2})" -f $i, $status, $label)
}

Write-Output ""
Write-Output "Chegaram na API: $passed | Bloqueadas (429): $limited"
