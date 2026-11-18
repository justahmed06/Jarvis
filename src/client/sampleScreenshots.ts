export interface SampleScreenshot {
  id: string;
  name: string;
  description: string;
  suggestedGoal: string;
  getSvg: () => string;
}

/**
 * Renders an SVG string onto an HTML Canvas and outputs a valid PNG Data URL.
 * Falls back to base64 SVG if canvas is unavailable.
 */
export async function renderSvgToPng(svgString: string, width = 800, height = 480): Promise<{ dataUrl: string; mimeType: string }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    const b64 = typeof Buffer !== 'undefined' ? Buffer.from(svgString).toString('base64') : '';
    return { dataUrl: `data:image/svg+xml;base64,${b64}`, mimeType: 'image/svg+xml' };
  }

  return new Promise((resolve) => {
    const img = new Image();
    const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const pngUrl = canvas.toDataURL('image/png');
          URL.revokeObjectURL(url);
          resolve({ dataUrl: pngUrl, mimeType: 'image/png' });
          return;
        }
      } catch {
        // Fallback
      }
      URL.revokeObjectURL(url);
      const b64 = btoa(unescape(encodeURIComponent(svgString)));
      resolve({ dataUrl: `data:image/svg+xml;base64,${b64}`, mimeType: 'image/svg+xml' });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      const b64 = btoa(unescape(encodeURIComponent(svgString)));
      resolve({ dataUrl: `data:image/svg+xml;base64,${b64}`, mimeType: 'image/svg+xml' });
    };

    img.src = url;
  });
}

export const sampleScreenshots: SampleScreenshot[] = [
  {
    id: 'ts-error',
    name: 'TypeScript Compilation Error',
    description: 'VS Code editor showing TS2345 type mismatch in api/userService.ts',
    suggestedGoal: 'Analyze this TypeScript compilation error and organize the steps to fix the type mismatch.',
    getSvg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
  <rect width="800" height="480" fill="#1e1e1e"/>
  <!-- Window Header -->
  <rect width="800" height="36" fill="#2d2d2d"/>
  <circle cx="20" cy="18" r="6" fill="#ff5f56"/>
  <circle cx="40" cy="18" r="6" fill="#ffbd2e"/>
  <circle cx="60" cy="18" r="6" fill="#27c93f"/>
  <text x="90" y="23" fill="#cccccc" font-family="monospace" font-size="13">api/userService.ts - Visual Studio Code</text>

  <!-- Editor Content -->
  <text x="20" y="70" fill="#666666" font-family="monospace" font-size="14">1</text>
  <text x="50" y="70" fill="#569cd6" font-family="monospace" font-size="14">import</text>
  <text x="105" y="70" fill="#9cdcfe" font-family="monospace" font-size="14">{ User, UserProfile }</text>
  <text x="280" y="70" fill="#569cd6" font-family="monospace" font-size="14">from</text>
  <text x="325" y="70" fill="#ce9178" font-family="monospace" font-size="14">'./types';</text>

  <text x="20" y="100" fill="#666666" font-family="monospace" font-size="14">2</text>
  <text x="50" y="100" fill="#569cd6" font-family="monospace" font-size="14">export async function</text>
  <text x="235" y="100" fill="#dcdcaa" font-family="monospace" font-size="14">updateUserAge</text>
  <text x="350" y="100" fill="#d4d4d4" font-family="monospace" font-size="14">(userId: string, rawInput: string): Promise&lt;User&gt; {</text>

  <text x="20" y="130" fill="#666666" font-family="monospace" font-size="14">3</text>
  <text x="70" y="130" fill="#6a9955" font-family="monospace" font-size="14">// ERROR: age expects a number, but rawInput is string</text>

  <text x="20" y="160" fill="#666666" font-family="monospace" font-size="14">4</text>
  <text x="70" y="160" fill="#569cd6" font-family="monospace" font-size="14">const</text>
  <text x="120" y="160" fill="#4fc1ff" font-family="monospace" font-size="14">updatedUser</text>
  <text x="215" y="160" fill="#d4d4d4" font-family="monospace" font-size="14">= await db.users.update(userId, {</text>

  <text x="20" y="190" fill="#666666" font-family="monospace" font-size="14">5</text>
  <text x="90" y="190" fill="#9cdcfe" font-family="monospace" font-size="14">age:</text>
  <text x="130" y="190" fill="#f44747" font-family="monospace" font-size="14" text-decoration="underline">rawInput</text>

  <!-- Error Tooltip Card -->
  <rect x="80" y="220" width="640" height="130" rx="6" fill="#252526" stroke="#f44747" stroke-width="1.5"/>
  <rect x="80" y="220" width="640" height="26" rx="6" fill="#332222"/>
  <text x="95" y="238" fill="#f48771" font-family="monospace" font-size="12" font-weight="bold">TypeScript Error TS2345</text>
  <text x="95" y="270" fill="#cccccc" font-family="monospace" font-size="13">Argument of type 'string' is not assignable to parameter of type 'number'.</text>
  <text x="95" y="295" fill="#888888" font-family="monospace" font-size="12">The type 'string' is not assignable to 'number'. Did you mean parseInt(rawInput, 10)?</text>
  <text x="95" y="325" fill="#3794ff" font-family="monospace" font-size="12">Quick Fix... (Ctrl+.) | Peek Problem (Alt+F8)</text>

  <!-- Terminal Status bar -->
  <rect y="444" width="800" height="36" fill="#007acc"/>
  <text x="20" y="466" fill="#ffffff" font-family="monospace" font-size="12">Problems: 1 Error | Ln 5, Col 10 | UTF-8 | TypeScript 5.7.3</text>
</svg>`,
  },
  {
    id: 'test-failure',
    name: 'Pytest Suite Failure',
    description: 'Terminal running pytest showing AssertionError in test_auth_token_expiry',
    suggestedGoal: 'Inspect this test failure and propose tasks to debug the token expiry assertion.',
    getSvg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
  <rect width="800" height="480" fill="#0c1017"/>
  <!-- Terminal Header -->
  <rect width="800" height="36" fill="#161b22"/>
  <circle cx="20" cy="18" r="6" fill="#ff5f56"/>
  <circle cx="40" cy="18" r="6" fill="#ffbd2e"/>
  <circle cx="60" cy="18" r="6" fill="#27c93f"/>
  <text x="90" y="23" fill="#8b949e" font-family="monospace" font-size="13">bash — pytest tests/test_auth.py (venv)</text>

  <!-- Terminal Output -->
  <text x="20" y="70" fill="#58a6ff" font-family="monospace" font-size="13">$ pytest tests/test_auth.py -v</text>
  <text x="20" y="95" fill="#c9d1d9" font-family="monospace" font-size="13">============================= test session starts ==============================</text>
  <text x="20" y="120" fill="#8b949e" font-family="monospace" font-size="13">rootdir: /home/dev/workspace/auth-service</text>
  <text x="20" y="145" fill="#c9d1d9" font-family="monospace" font-size="13">collected 4 items</text>

  <text x="20" y="175" fill="#3fb950" font-family="monospace" font-size="13">tests/test_auth.py::test_login_success PASSED                         [ 25%]</text>
  <text x="20" y="200" fill="#3fb950" font-family="monospace" font-size="13">tests/test_auth.py::test_invalid_credentials PASSED                   [ 50%]</text>
  <text x="20" y="225" fill="#f85149" font-family="monospace" font-size="13">tests/test_auth.py::test_token_expiry FAILED                          [ 75%]</text>
  <text x="20" y="250" fill="#3fb950" font-family="monospace" font-size="13">tests/test_auth.py::test_refresh_token PASSED                         [100%]</text>

  <!-- Failure Details -->
  <rect x="15" y="270" width="770" height="135" rx="4" fill="#211215" stroke="#f85149" stroke-width="1"/>
  <text x="30" y="295" fill="#f85149" font-family="monospace" font-size="13" font-weight="bold">___________________________ test_token_expiry ___________________________</text>
  <text x="30" y="320" fill="#c9d1d9" font-family="monospace" font-size="12">>       assert response.status_code == 401</text>
  <text x="30" y="345" fill="#f85149" font-family="monospace" font-size="12">E       AssertionError: assert 200 == 401</text>
  <text x="30" y="370" fill="#8b949e" font-family="monospace" font-size="12">E        +  where 200 = &lt;Response [200 OK]&gt;.status_code</text>
  <text x="30" y="390" fill="#8b949e" font-family="monospace" font-size="12">tests/test_auth.py:48: AssertionError (Expired token accepted by middleware)</text>

  <text x="20" y="440" fill="#f85149" font-family="monospace" font-size="13" font-weight="bold">FAILED tests/test_auth.py::test_token_expiry - 1 failed, 3 passed in 0.42s</text>
</svg>`,
  },
  {
    id: 'docker-build',
    name: 'Docker Build Missing File',
    description: 'Terminal error: COPY failed: file not found in build context: package-lock.json',
    suggestedGoal: 'Help me understand why the Docker build failed and list steps to resolve it.',
    getSvg: () => `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="480" viewBox="0 0 800 480">
  <rect width="800" height="480" fill="#0f172a"/>
  <!-- Terminal Header -->
  <rect width="800" height="36" fill="#1e293b"/>
  <circle cx="20" cy="18" r="6" fill="#ef4444"/>
  <circle cx="40" cy="18" r="6" fill="#f59e0b"/>
  <circle cx="60" cy="18" r="6" fill="#10b981"/>
  <text x="90" y="23" fill="#94a3b8" font-family="monospace" font-size="13">docker build -t api-service .</text>

  <text x="20" y="75" fill="#38bdf8" font-family="monospace" font-size="13">[+] Building 2.1s (7/9)</text>
  <text x="20" y="105" fill="#94a3b8" font-family="monospace" font-size="13"> => [internal] load build definition from Dockerfile                     0.0s</text>
  <text x="20" y="130" fill="#94a3b8" font-family="monospace" font-size="13"> => [internal] load .dockerignore                                        0.0s</text>
  <text x="20" y="155" fill="#94a3b8" font-family="monospace" font-size="13"> => [1/5] FROM docker.io/library/node:20-alpine                          1.2s</text>
  <text x="20" y="180" fill="#94a3b8" font-family="monospace" font-size="13"> => [2/5] WORKDIR /app                                                   0.1s</text>
  <text x="20" y="205" fill="#ef4444" font-family="monospace" font-size="13"> => ERROR [3/5] COPY package.json package-lock.json ./                   0.0s</text>

  <!-- Error Box -->
  <rect x="15" y="230" width="770" height="140" rx="6" fill="#1f1315" stroke="#ef4444" stroke-width="1.5"/>
  <text x="30" y="260" fill="#ef4444" font-family="monospace" font-size="13" font-weight="bold">------</text>
  <text x="30" y="285" fill="#fca5a5" font-family="monospace" font-size="13"> > [3/5] COPY package.json package-lock.json ./ :</text>
  <text x="30" y="315" fill="#ef4444" font-family="monospace" font-size="13">failed to compute cache key: failed to calculate checksum for ref:</text>
  <text x="30" y="340" fill="#ef4444" font-family="monospace" font-size="13">"/package-lock.json": not found</text>
  <text x="30" y="360" fill="#94a3b8" font-family="monospace" font-size="12">Suggestion: run npm install locally or switch Dockerfile to yarn.lock / pnpm-lock.yaml</text>

  <text x="20" y="420" fill="#f87171" font-family="monospace" font-size="13">ERROR: failed to solve: process "/bin/sh -c" did not complete successfully: exit code: 1</text>
</svg>`,
  },
];
