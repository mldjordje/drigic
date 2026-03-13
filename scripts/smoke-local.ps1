param(
  [string]$BaseUrl = "http://127.0.0.1:4010"
)

$ErrorActionPreference = "Stop"
$results = @()

function Add-Result {
  param(
    [string]$Name,
    [bool]$Ok,
    [string]$Detail
  )
  $script:results += [pscustomobject]@{
    check = $Name
    ok = $Ok
    detail = $Detail
  }
}

function Get-StatusFromError {
  param($ErrorRecord)
  if ($ErrorRecord.Exception.Response -and $ErrorRecord.Exception.Response.StatusCode) {
    return [int]$ErrorRecord.Exception.Response.StatusCode
  }
  return -1
}

function Find-ServiceSelection {
  param($Categories)

  $services = @()
  foreach ($category in ($Categories | Where-Object { $_ })) {
    foreach ($service in ($category.services | Where-Object { $_ })) {
      $services += $service
    }
  }

  $simple = $services |
    Where-Object { $_.kind -eq "single" -and -not $_.supportsMl } |
    Select-Object -First 1
  if ($simple) {
    return @{
      serviceId = $simple.id
      quantity = 1
    }
  }

  $fallback = $services | Where-Object { $_.kind -eq "single" } | Select-Object -First 1
  if (-not $fallback) {
    return $null
  }

  if ($fallback.supportsMl -and "$($fallback.name)".ToLower().Contains("hijaluronski filer")) {
    return @{
      serviceId = $fallback.id
      quantity = 1
      brand = "revolax"
    }
  }

  return @{
    serviceId = $fallback.id
    quantity = 1
  }
}

try {
  try {
    $anonAdminResponse = Invoke-WebRequest -Uri "$BaseUrl/admin/kalendar" -UseBasicParsing
    $finalUri = "$($anonAdminResponse.BaseResponse.ResponseUri)"
    $ok = $anonAdminResponse.StatusCode -eq 200 -and $finalUri.Contains("/prijava")
    Add-Result "anon_admin_redirect" $ok "status=$($anonAdminResponse.StatusCode) final=$finalUri"
  } catch {
    $status = Get-StatusFromError $_
    $location = $_.Exception.Response.Headers["Location"]
    $ok = ($status -ge 300 -and $status -lt 400 -and "$location".Contains("/prijava"))
    Add-Result "anon_admin_redirect" $ok "status=$status location=$location"
  }

  $clientSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $clientEmail = "smoke.client.$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())@example.com"
  $clientOtpReq = Invoke-RestMethod `
    -Method POST `
    -Uri "$BaseUrl/api/auth/request-otp" `
    -WebSession $clientSession `
    -ContentType "application/json" `
    -Body (@{ identifier = $clientEmail } | ConvertTo-Json -Compress)

  if (-not $clientOtpReq.devOtp) {
    throw "Client OTP code missing in dev response."
  }
  Add-Result "client_request_otp" $true "expiresAt=$($clientOtpReq.expiresAt)"

  $clientVerify = Invoke-RestMethod `
    -Method POST `
    -Uri "$BaseUrl/api/auth/verify-otp" `
    -WebSession $clientSession `
    -ContentType "application/json" `
    -Body (@{ identifier = $clientEmail; code = $clientOtpReq.devOtp } | ConvertTo-Json -Compress)

  Add-Result "client_verify_otp" ([bool]$clientVerify.ok) "role=$($clientVerify.user.role)"

  $clientProfile = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/me/profile" -WebSession $clientSession
  Add-Result "client_profile" ([bool]$clientProfile.ok -and $clientProfile.user.role -eq "client") "role=$($clientProfile.user.role)"

  $services = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/services"
  $selection = Find-ServiceSelection -Categories $services.categories
  if (-not $selection) {
    throw "No active single service found for smoke test."
  }
  Add-Result "services_loaded" $true "serviceId=$($selection.serviceId)"

  $selections = @($selection)
  $quote = Invoke-RestMethod `
    -Method POST `
    -Uri "$BaseUrl/api/bookings/quote" `
    -WebSession $clientSession `
    -ContentType "application/json" `
    -Body (@{ serviceSelections = $selections } | ConvertTo-Json -Compress)
  Add-Result "booking_quote" ([bool]$quote.ok) "duration=$($quote.totalDurationMin)"

  $monthKeys = @(
    (Get-Date).ToString("yyyy-MM"),
    (Get-Date).AddMonths(1).ToString("yyyy-MM")
  )
  $selectedDate = $null
  $selectionJson = ($selection | ConvertTo-Json -Compress)
  $encodedSelections = [Uri]::EscapeDataString("[$selectionJson]")
  foreach ($month in $monthKeys) {
    $monthData = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/bookings/availability?month=$month&serviceSelections=$encodedSelections"
    $firstOpenDay = $monthData.days | Where-Object { [int]$_.availableSlots -gt 0 } | Select-Object -First 1
    if ($firstOpenDay) {
      $selectedDate = $firstOpenDay.date
      break
    }
  }

  if (-not $selectedDate) {
    throw "No available date found in current/next month."
  }
  Add-Result "availability_month" $true "date=$selectedDate"

  $dayData = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/bookings/availability?date=$selectedDate&serviceSelections=$encodedSelections"
  $slot = $dayData.slots | Where-Object { $_.available -eq $true } | Select-Object -First 1
  if (-not $slot) {
    throw "No available slot found for date $selectedDate."
  }
  Add-Result "availability_day" $true "startAt=$($slot.startAt)"

  $booking = Invoke-RestMethod `
    -Method POST `
    -Uri "$BaseUrl/api/bookings" `
    -WebSession $clientSession `
    -ContentType "application/json" `
    -Body (@{
      serviceSelections = $selections
      startAt = $slot.startAt
      notes = "Smoke test booking"
    } | ConvertTo-Json -Compress)
  Add-Result "booking_create_client" ([bool]$booking.ok) "id=$($booking.booking.id) status=$($booking.booking.status)"

  try {
    Invoke-WebRequest -Method GET -Uri "$BaseUrl/api/admin/bookings" -WebSession $clientSession -UseBasicParsing | Out-Null
    Add-Result "client_blocked_from_admin_api" $false "Expected 403, got success."
  } catch {
    $status = Get-StatusFromError $_
    Add-Result "client_blocked_from_admin_api" ($status -eq 403) "status=$status"
  }

  $adminSession = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $adminEmail = "smoke.admin@drigic.local"
  $adminOtpReq = Invoke-RestMethod `
    -Method POST `
    -Uri "$BaseUrl/api/auth/request-otp" `
    -WebSession $adminSession `
    -ContentType "application/json" `
    -Body (@{ identifier = $adminEmail } | ConvertTo-Json -Compress)

  if (-not $adminOtpReq.devOtp) {
    throw "Admin OTP code missing in dev response."
  }
  Add-Result "admin_request_otp" $true "expiresAt=$($adminOtpReq.expiresAt)"

  $adminVerify = Invoke-RestMethod `
    -Method POST `
    -Uri "$BaseUrl/api/auth/verify-otp" `
    -WebSession $adminSession `
    -ContentType "application/json" `
    -Body (@{ identifier = $adminEmail; code = $adminOtpReq.devOtp } | ConvertTo-Json -Compress)
  Add-Result "admin_verify_otp" ([bool]$adminVerify.ok -and $adminVerify.user.role -eq "admin") "role=$($adminVerify.user.role)"

  $adminBookings = Invoke-RestMethod -Method GET -Uri "$BaseUrl/api/admin/bookings" -WebSession $adminSession
  Add-Result "admin_bookings_api" ([bool]$adminBookings.ok) "rows=$($adminBookings.data.Count)"
} catch {
  Add-Result "smoke_runtime" $false "$_"
}

$results | Format-Table -AutoSize | Out-String | Write-Output
$failed = @($results | Where-Object { -not $_.ok })
if ($failed.Count -gt 0) {
  exit 1
}
exit 0
