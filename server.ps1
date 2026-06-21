$port = 8000
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
$listener.Start()
Write-Host "Listening on http://localhost:$port/"

try {
    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response

        $rawUrl = $request.Url.LocalPath
        if ($rawUrl -eq "/") { $rawUrl = "/index.html" }
        
        # Translate to local path
        $localPath = Join-Path "c:\Users\pcs\flight tiket booking" $rawUrl.TrimStart('/')
        
        if (Test-Path $localPath -PathType Leaf) {
            $extension = [System.IO.Path]::GetExtension($localPath).ToLower()
            $contentType = "text/plain"
            switch ($extension) {
                ".html" { $contentType = "text/html" }
                ".htm" { $contentType = "text/html" }
                ".css" { $contentType = "text/css" }
                ".js"  { $contentType = "application/javascript" }
                ".png" { $contentType = "image/png" }
                ".jpg" { $contentType = "image/jpeg" }
                ".jpeg" { $contentType = "image/jpeg" }
                ".gif" { $contentType = "image/gif" }
                ".svg" { $contentType = "image/svg+xml" }
                ".ico" { $contentType = "image/x-icon" }
            }
            
            $response.ContentType = $contentType
            $bytes = [System.IO.File]::ReadAllBytes($localPath)
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $bytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        }
        $response.OutputStream.Close()
    }
} catch {
    Write-Host "Error occurred: $_"
} finally {
    $listener.Stop()
}
