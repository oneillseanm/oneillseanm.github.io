param(
	[string]$ConfigFile = "test-shopify.js"
)

$ErrorActionPreference = "Stop"

$projectRoot = Split-Path -Parent $PSScriptRoot
$configPath = Join-Path $projectRoot $ConfigFile

if (-not (Test-Path -LiteralPath $configPath)) {
	throw "Shopify configuration file not found: $configPath"
}

$config = [System.IO.File]::ReadAllText($configPath)

function Get-ConfigValue {
	param(
		[string]$Name
	)

	$match = [regex]::Match($config, "$Name\s*:\s*'([^']+)'\s*,")
	if (-not $match.Success) {
		throw "Unable to read $Name from $ConfigFile"
	}

	return $match.Groups[1].Value
}

$apiVersion = Get-ConfigValue "apiVersion"
$domain = Get-ConfigValue "domain"
$storefrontAccessToken = Get-ConfigValue "storefrontAccessToken"

$query = @"
query PoliciesForAOkay {
  shop {
    privacyPolicy { body }
    refundPolicy { body }
    shippingPolicy { body }
    termsOfService { body }
  }
}
"@

$headers = @{
	"X-Shopify-Storefront-Access-Token" = $storefrontAccessToken
}

$payload = @{ query = $query } | ConvertTo-Json -Compress
$uri = "https://$domain/api/$apiVersion/graphql.json"
$response = Invoke-RestMethod -Method Post -Uri $uri -Headers $headers -ContentType "application/json" -Body $payload

if ($response.errors) {
	$messages = $response.errors | ForEach-Object { $_.message }
	throw "Shopify returned an error: $($messages -join '; ')"
}

$policies = @(
	@{ File = "test-privacy.html"; Field = "privacyPolicy" },
	@{ File = "test-returns.html"; Field = "refundPolicy" },
	@{ File = "test-shipping.html"; Field = "shippingPolicy" },
	@{ File = "test-terms.html"; Field = "termsOfService" }
)

$markerPattern = '(?ms)^[ \t]*<!-- shopify-policy-fallback:start -->\r?\n.*?^[ \t]*<!-- shopify-policy-fallback:end -->'
$utf8WithoutBom = New-Object System.Text.UTF8Encoding($false)

foreach ($policy in $policies) {
	$filePath = Join-Path $projectRoot $policy.File
	$html = [System.IO.File]::ReadAllText($filePath)
	$markerMatch = [regex]::Match($html, $markerPattern)

	if (-not $markerMatch.Success) {
		throw "Synchronization markers not found in $($policy.File)"
	}

	$policyBody = $response.data.shop.($policy.Field).body
	if ([string]::IsNullOrWhiteSpace($policyBody)) {
		throw "Shopify policy $($policy.Field) is empty"
	}

	$newline = if ($html.Contains("`r`n")) { "`r`n" } else { "`n" }
	$indentMatch = [regex]::Match($markerMatch.Value, '^(?<indent>[ \t]*)')
	$indent = $indentMatch.Groups['indent'].Value
	$normalizedBody = $policyBody.Trim() -replace "`r`n?", "`n"
	$indentedBody = (($normalizedBody -split "`n") | ForEach-Object { "$indent$_" }) -join $newline
	$replacement = @(
		"$indent<!-- shopify-policy-fallback:start -->",
		$indentedBody,
		"$indent<!-- shopify-policy-fallback:end -->"
	) -join $newline

	$updatedHtml = $html.Substring(0, $markerMatch.Index) + $replacement + $html.Substring($markerMatch.Index + $markerMatch.Length)
	[System.IO.File]::WriteAllText($filePath, $updatedHtml, $utf8WithoutBom)
	Write-Output "Synchronized $($policy.Field) -> $($policy.File)"
}
