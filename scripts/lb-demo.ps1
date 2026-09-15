# Load balancer demo: sends requests through the gateway and prints which API replica answered each one.
# Usage: .\scripts\lb-demo.ps1 [-Total 10] [-BaseUrl http://localhost:8080]
param(
    [int]$Total = 10,
    [string]$BaseUrl = "http://localhost:8080"
)

$count = @{}

for ($i = 1; $i -le $Total; $i++) {
    $response = Invoke-WebRequest -Uri "$BaseUrl/actuator/health" -UseBasicParsing
    $instance = [string]$response.Headers["X-Instance-Id"]
    $count[$instance] = 1 + $count[$instance]
    Write-Output ("#{0,-2} -> {1}" -f $i, $instance)
}

Write-Output ""
Write-Output "Resumo:"
$count.GetEnumerator() | Sort-Object Name | ForEach-Object { Write-Output "  $($_.Name): $($_.Value)" }
