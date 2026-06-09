
const formEl = document.getElementById('memo-form');
const statusEl = document.getElementById('status');
const listEl = document.getElementById('memo-list');
statusEl.textContent = 'app.js 연결 완료';




async function apiRequest(path, options = {}) {
  const res = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    },
    ...options,
  });

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.message || res.statusText || '요청 실패');
  }

  if (json.success === false) {
    throw new Error(json.message || '요청 실패');
  }

  return json;
}

function setStatus(message) {
  statusEl.textContent = message || '';
}


async function loadMemos() {
  try {
    setStatus('목록 불러오는 중...');
    const result = await apiRequest('/memos');
    renderMemoList(result.data || []);
    setStatus('');
  } catch (err) {
    setStatus(err.message);
  }
}

loadMemos();

function renderMemoList(memos) {
  listEl.innerHTML = '';

  if (memos.length === 0) {
    listEl.innerHTML = '<li class="empty">아직 메모가 없습니다.</li>';
    return;
  }

  for (const memo of memos) {
    const item = document.createElement('li');
    item.className = 'memo-card';
    item.innerHTML = `
      <strong>${escapeHtml(memo.title)}</strong>
      <p>${escapeHtml(memo.content || '')}</p>
      <button type="button" data-action="edit" data-id="${memo.id}">수정</button>
      <button type="button" data-action="delete" data-id="${memo.id}">삭제</button>
      <button type="button" data-action="pin" data-id="${memo.id}">
        ${memo.pinned ? '핀 해제' : '핀'}
      </button>
    `;
    listEl.appendChild(item);
  }
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}



formEl.addEventListener('submit', async (event) => {
  event.preventDefault();

  const formData = new FormData(formEl);
  const imageUrl = formData.get('image_url').trim();
  const title = formData.get('title').trim();
  const content = formData.get('content').trim();

  if (!title) {
    setStatus('제목은 필수입니다.');
    return;
  }

  try {
    setStatus('저장 중...');
    await apiRequest('/memos', {
      method: 'POST',
      body: JSON.stringify({ title, content }),
    });
    formEl.reset();
    await loadMemos();
    setStatus('저장했습니다.');
  } catch (err) {
    setStatus(err.message);
  }
});

let editingId = null;

async function startEdit(id) {
  try {
    const result = await apiRequest(`/memos/${id}`);
    const memo = result.data;

    editingId = memo.id;
    formEl.elements.title.value = memo.title;
    formEl.elements.content.value = memo.content || '';

    document.getElementById('form-title').textContent = '메모 수정';
    document.getElementById('submit-button').textContent = '수정 저장';
    document.getElementById('cancel-edit').hidden = false;
  } catch (err) {
    setStatus(err.message);
  }
}

async function updateMemo(id, { title, content }) {
  const current = await apiRequest(`/memos/${id}`);

  await apiRequest(`/memos/${id}`, {
    method: 'PUT',
    body: JSON.stringify({
      title,
      content,
      pinned: Boolean(current.data.pinned),
      image_url: current.data.image_url ?? null,
    }),
  });
}

function resetEditMode() {
  editingId = null;
  document.getElementById('form-title').textContent = '새 메모';
  document.getElementById('submit-button').textContent = '저장';
  document.getElementById('cancel-edit').hidden = true;
}

listEl.addEventListener('click', async (event) => {
  const button = event.target.closest('button[data-action]');
  if (!button) return;

  const id = Number(button.dataset.id);
  const action = button.dataset.action;

  if (action === 'edit') await startEdit(id);
  if (action === 'delete') await deleteMemo(id);
  if (action === 'pin') await togglePin(id);
});

async function deleteMemo(id) {
  if (!confirm('정말 삭제할까요?')) return;

  try {
    setStatus('삭제 중...');
    await apiRequest(`/memos/${id}`, { method: 'DELETE' });
    await loadMemos();
    setStatus('삭제했습니다.');
  } catch (err) {
    setStatus(err.message);
  }
}

async function togglePin(id) {
  try {
    const result = await apiRequest(`/memos/${id}`);
    const memo = result.data;

    await apiRequest(`/memos/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: memo.title,
        content: memo.content || '',
        pinned: !memo.pinned,
        image_url: memo.image_url ?? null,
      }),
    });

    await loadMemos();
  } catch (err) {
    setStatus(err.message);
  }
  
}


