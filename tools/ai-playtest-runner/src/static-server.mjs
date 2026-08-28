import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';

const MIME_TYPES = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.woff2': 'font/woff2',
};

function resolveRequestPath(rootDir, requestUrl) {
  const url = new URL(requestUrl, 'http://127.0.0.1');
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(url.pathname);
  } catch {
    return null;
  }

  const relativePath = decodedPath.replace(/^[/\\]+/, '') || 'index.html';
  if (relativePath.includes('\\')) {
    return null;
  }

  const candidate = path.resolve(rootDir, relativePath);
  const relative = path.relative(rootDir, candidate);
  if (relative === '..' || relative.startsWith('..' + path.sep) || path.isAbsolute(relative)) {
    return null;
  }
  return candidate;
}

function respond(response, statusCode, body, contentType = 'text/plain; charset=utf-8') {
  response.writeHead(statusCode, { 'Content-Type': contentType });
  response.end(body);
}

export async function startStaticServer({ rootDir, host = '127.0.0.1', port = 0 }) {
  const root = path.resolve(rootDir);
  const server = createServer(async (request, response) => {
    const filePath = resolveRequestPath(root, request.url ?? '/');
    if (!filePath) {
      respond(response, 403, 'Forbidden');
      return;
    }

    try {
      const info = await stat(filePath);
      if (!info.isFile()) {
        respond(response, 404, 'Not Found');
        return;
      }
      const content = await readFile(filePath);
      respond(response, 200, content, MIME_TYPES[path.extname(filePath).toLowerCase()] ?? 'application/octet-stream');
    } catch (error) {
      if (error?.code === 'ENOENT') {
        respond(response, 404, 'Not Found');
        return;
      }
      respond(response, 500, 'Static server error');
    }
  });

  await new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, host, () => {
      server.off('error', reject);
      resolve();
    });
  });

  const address = server.address();
  if (!address || typeof address === 'string') {
    server.close();
    throw new Error('정적 서버 주소를 확인할 수 없습니다.');
  }

  return {
    url: 'http://' + host + ':' + String(address.port) + '/',
    close: () => new Promise((resolve, reject) => {
      server.close(error => (error ? reject(error) : resolve()));
    }),
  };
}
