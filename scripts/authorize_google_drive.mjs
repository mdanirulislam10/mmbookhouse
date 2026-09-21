import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';
import { createServer } from 'node:http';
import { google } from 'googleapis';

const host = '127.0.0.1';
const scope = 'https://www.googleapis.com/auth/drive.file';
const maxBodyBytes = 16 * 1024;

let oauthClient = null;
let expectedState = null;

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[character]);
}

function sendHtml(response, status, title, body) {
  response.writeHead(status, {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
    'Referrer-Policy': 'no-referrer',
    'Content-Security-Policy': "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; base-uri 'none'",
  });
  response.end(`<!doctype html>
    <html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
    <title>${escapeHtml(title)}</title><style>
      body{font:16px system-ui;background:#f4f5f7;color:#17202a;margin:0;padding:32px}
      main{max-width:620px;margin:auto;background:white;border:1px solid #d9dde3;border-radius:16px;padding:28px;box-shadow:0 8px 30px #0001}
      label{display:block;font-weight:700;margin-top:18px}input{box-sizing:border-box;width:100%;margin-top:7px;padding:12px;border:1px solid #aeb6bf;border-radius:8px}
      button{margin-top:22px;background:#1a73e8;color:white;border:0;border-radius:8px;padding:12px 18px;font-weight:700;cursor:pointer}
      p{line-height:1.6}.note{background:#fff8e1;border-radius:8px;padding:12px}.ok{color:#137333;font-weight:800}
    </style></head><body><main><h1>${escapeHtml(title)}</h1>${body}</main></body></html>`);
}

async function readForm(request) {
  let body = '';
  for await (const chunk of request) {
    body += chunk;
    if (Buffer.byteLength(body) > maxBodyBytes) throw new Error('Form is too large.');
  }
  return new URLSearchParams(body);
}

function copyToClipboard(value) {
  return new Promise((resolve, reject) => {
    const child = spawn('clip.exe', [], { stdio: ['pipe', 'ignore', 'pipe'] });
    let stderr = '';
    child.stderr.on('data', (chunk) => { stderr += chunk; });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(stderr || `clip.exe exited with ${code}`)));
    child.stdin.end(value);
  });
}

const server = createServer(async (request, response) => {
  try {
    const currentUrl = new URL(request.url || '/', `http://${host}`);

    if (request.method === 'GET' && currentUrl.pathname === '/') {
      sendHtml(response, 200, 'MM Enterprise Drive authorization', `
        <p>This local page sends the credentials only to Google OAuth and never stores them on disk.</p>
        <form method="post" action="/start" autocomplete="off">
          <label>Google OAuth Client ID<input name="client_id" required spellcheck="false"></label>
          <label>Google OAuth Client secret<input name="client_secret" type="password" required spellcheck="false"></label>
          <button type="submit">Authorize Google Drive</button>
        </form>
        <p class="note">Use only the owner account that must own the encrypted backup folder.</p>`);
      return;
    }

    if (request.method === 'POST' && currentUrl.pathname === '/start') {
      const form = await readForm(request);
      const clientId = form.get('client_id')?.trim();
      const clientSecret = form.get('client_secret')?.trim();
      if (!clientId?.endsWith('.apps.googleusercontent.com') || !clientSecret) {
        sendHtml(response, 400, 'Invalid credentials', '<p>Check the Client ID and Client secret and try again.</p>');
        return;
      }

      const address = server.address();
      const redirectUri = `http://${host}:${address.port}/oauth2callback`;
      oauthClient = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
      expectedState = randomBytes(24).toString('hex');
      const authorizationUrl = oauthClient.generateAuthUrl({
        access_type: 'offline',
        prompt: 'consent',
        scope: [scope],
        state: expectedState,
        include_granted_scopes: true,
      });
      // A direct POST -> cross-origin redirect can be blocked by the restrictive
      // form-action CSP. Return an explicit navigation link instead; the client
      // secret stays in server memory and is never included in the link.
      sendHtml(response, 200, 'Continue to Google', `
        <p>The local form was accepted. Your Client secret remains on this computer.</p>
        <p><a href="${escapeHtml(authorizationUrl)}" rel="noreferrer" style="display:inline-block;background:#1a73e8;color:white;padding:12px 18px;border-radius:8px;text-decoration:none;font-weight:700">Continue to Google</a></p>
        <p class="note">Google will ask the owner to approve access to files created by this backup app.</p>`);
      return;
    }

    if (request.method === 'GET' && currentUrl.pathname === '/oauth2callback') {
      if (!oauthClient || !expectedState || currentUrl.searchParams.get('state') !== expectedState) {
        sendHtml(response, 400, 'Authorization rejected', '<p>The OAuth state did not match. Restart the helper and try again.</p>');
        return;
      }
      const oauthError = currentUrl.searchParams.get('error');
      const code = currentUrl.searchParams.get('code');
      if (oauthError || !code) {
        sendHtml(response, 400, 'Authorization not completed', `<p>Google returned: ${escapeHtml(oauthError || 'missing authorization code')}.</p>`);
        return;
      }

      const { tokens } = await oauthClient.getToken(code);
      if (!tokens.refresh_token) throw new Error('Google did not return a refresh token. Revoke the existing app grant and authorize again.');
      await copyToClipboard(tokens.refresh_token);
      oauthClient = null;
      expectedState = null;
      sendHtml(response, 200, 'Authorization complete', `
        <p class="ok">The Google Drive refresh token is now on the Windows clipboard.</p>
        <p>Immediately save it as the GitHub repository secret <strong>GOOGLE_DRIVE_REFRESH_TOKEN</strong>. Do not paste it into chat or a note.</p>
        <p>You may close this tab. This local helper will stop automatically.</p>`);
      setTimeout(() => server.close(), 60_000).unref();
      return;
    }

    sendHtml(response, 404, 'Not found', '<p>This local page does not exist.</p>');
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unexpected error';
    sendHtml(response, 500, 'Authorization failed', `<p>${escapeHtml(message)}</p>`);
  }
});

server.listen(0, host, () => {
  const address = server.address();
  const localUrl = `http://${host}:${address.port}/`;
  console.log(`Google Drive authorization helper is ready at ${localUrl}`);
  console.log('Open this URL in the owner\'s Chrome browser.');
});
