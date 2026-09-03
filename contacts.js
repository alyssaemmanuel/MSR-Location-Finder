(function () {
  let contacts = [];

  const list = document.querySelector('#contact-list');
  const status = document.querySelector('#results-status');
  const titleText = document.querySelector('#finder-title-text');
  const form = document.querySelector('#contact-search-form');
  const input = document.querySelector('#contact-search');
  const note = document.querySelector('#contact-search-note');
  const loadMoreBtn = document.querySelector('#load-more-btn');

  const PAGE_SIZE = 100;
  let visibleCount = PAGE_SIZE;
  let currentQuery = '';

  const SALES_REPS = {
    'Jeffrey Rubin': { phone: '(516) 993-0070', email: 'jrubin@healthplusmgmt.com' },
    'Angela Lastihenos': { phone: '(516) 492-2884', email: 'angela@msrconcierge.com' },
    'Johanna Galabay': { phone: '(917) 825-1393', email: 'Johanna@msrconcierge.com' },
    'Joseph Barriga': { phone: '(516) 993-0071', email: 'jrubin@healthplusmgmt.com' },
  };

  // Keyed by exact contact `name` field
  const ATTORNEY_NOTES = {
    'Ali Yusaf, Esq': [
      { label: 'Accident Description', text: 'Document exactly as provided by the firm.' },
      { text: 'Enter the description in the intake, NextGen, and doctor’s notes.' },
    ],
    'Michael Lamonsoff': [
      { text: 'Schedule with Medical Director only, unless otherwise instructed.' },
      { text: 'Exceptions require law firm approval + site confirmation.' },
    ],
    'Frank Laine, Esq.': [
      { label: 'NYPD Patrol Officer cases', text: 'Schedule next available appointment regardless of authorization status.' },
      { text: 'Firm will honor a lien if a claim is not established.' },
      { text: 'Notify the facility’s verification specialist in advance.' },
      { text: 'Document appointment date and authorization status for patient follow-up.' },
    ],
    'Marc DeSalvo, Esq.': [
      { text: 'Primarily Lien cases — $3,000 hard cap.' },
      { text: 'Once scheduled, notify Liens Department to note the file/create alert.' },
    ],
  };

  // Keyed by exact contact `company` field
  const FIRM_NOTES = {
    'Chopra & Nocerino, P.C.': [
      { text: 'Do NOT schedule new patients from this firm at Perry PM&R Deer Park location.' },
      { text: 'Schedule at the next available location, regardless of distance.' },
    ],
  };

  const renderNoteItem = (item) => `
    <li>${item.label ? `<b>${item.label}:</b> ` : ''}${item.text}</li>
  `;

  const notesTooltip = document.createElement('div');
  notesTooltip.className = 'provider-tooltip';
  notesTooltip.hidden = true;
  document.body.appendChild(notesTooltip);

  function resolveNotes(key) {
    if (!key) return null;
    const sepIndex = key.indexOf('::');
    const type = key.slice(0, sepIndex);
    const name = key.slice(sepIndex + 2);
    if (type === 'attorney') return ATTORNEY_NOTES[name] ? { title: name, notes: ATTORNEY_NOTES[name] } : null;
    if (type === 'firm') return FIRM_NOTES[name] ? { title: name, notes: FIRM_NOTES[name] } : null;
    return null;
  }

  function showNotesTooltip(target) {
    const resolved = resolveNotes(target.dataset.notesKey);
    if (!resolved) return;
    notesTooltip.innerHTML = `
      <div class="provider-tooltip-title">${resolved.title}</div>
      <div class="provider-tooltip-kicker">Scheduling Notes</div>
      <ul class="provider-tooltip-list">${resolved.notes.map(renderNoteItem).join('')}</ul>
    `;
    notesTooltip.hidden = false;

    const rect = target.getBoundingClientRect();
    const tooltipRect = notesTooltip.getBoundingClientRect();
    let left = rect.left + window.scrollX;
    let top = rect.bottom + window.scrollY + 8;
    if (left + tooltipRect.width > window.scrollX + document.documentElement.clientWidth - 12) {
      left = window.scrollX + document.documentElement.clientWidth - tooltipRect.width - 12;
    }
    if (top + tooltipRect.height > window.scrollY + window.innerHeight - 12) {
      top = rect.top + window.scrollY - tooltipRect.height - 8;
    }
    notesTooltip.style.left = `${Math.max(12, left)}px`;
    notesTooltip.style.top = `${Math.max(12, top)}px`;
  }

  function hideNotesTooltip() {
    notesTooltip.hidden = true;
  }

  let notesTooltipHideTimer = null;
  function cancelNotesTooltipHide() { clearTimeout(notesTooltipHideTimer); }
  function scheduleNotesTooltipHide() {
    cancelNotesTooltipHide();
    notesTooltipHideTimer = setTimeout(() => {
      if (!notesTooltip.matches(':hover')) hideNotesTooltip();
    }, 150);
  }

  document.addEventListener('mouseover', (e) => {
    const target = e.target.closest('.has-scheduling-notes');
    if (target) { cancelNotesTooltipHide(); showNotesTooltip(target); }
  });
  document.addEventListener('mouseout', (e) => {
    const target = e.target.closest('.has-scheduling-notes');
    if (target && !target.contains(e.relatedTarget)) scheduleNotesTooltipHide();
  });
  notesTooltip.addEventListener('mouseenter', cancelNotesTooltipHide);
  notesTooltip.addEventListener('mouseleave', scheduleNotesTooltipHide);
  document.addEventListener('focusin', (e) => {
    const target = e.target.closest('.has-scheduling-notes');
    if (target) { cancelNotesTooltipHide(); showNotesTooltip(target); }
  });
  document.addEventListener('focusout', (e) => {
    const target = e.target.closest('.has-scheduling-notes');
    if (target) scheduleNotesTooltipHide();
  });

  const formatPhone = (phoneStr) => {
    if (!phoneStr) return '';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return phoneStr;
  };

  function render(query, resetPaging = true) {
    const q = (query || '').trim().toLowerCase();
    if (resetPaging) visibleCount = PAGE_SIZE;

    let matches = contacts;
    if (q) {
      matches = contacts.filter((c) => {
        return (c.name && c.name.toLowerCase().includes(q)) ||
          (c.company && c.company.toLowerCase().includes(q)) ||
          (c.phone && c.phone.replace(/\D/g, '').includes(q.replace(/\D/g, '')) && q.replace(/\D/g, ''));
      });
    }

    titleText.textContent = q ? `Results for "${query.trim()}"` : 'All Contacts';

    if (contacts.length === 0) {
      status.textContent = 'No contact data loaded yet.';
      list.innerHTML = `<li class="contact-empty">Contact data hasn't been added to this page yet.</li>`;
      loadMoreBtn.style.display = 'none';
      return;
    }

    const shown = matches.slice(0, visibleCount);
    status.textContent = matches.length > shown.length
      ? `Showing ${shown.length} of ${matches.length} matches`
      : `${matches.length} ${matches.length === 1 ? 'contact' : 'contacts'} found`;

    if (shown.length === 0) {
      list.innerHTML = `<li class="contact-empty">No contacts match that search.</li>`;
      loadMoreBtn.style.display = 'none';
      return;
    }

    if (matches.length > shown.length) {
      loadMoreBtn.style.display = 'inline-flex';
      loadMoreBtn.innerHTML = `Show more contacts (${Math.min(PAGE_SIZE, matches.length - shown.length)} more) &darr;`;
    } else {
      loadMoreBtn.style.display = 'none';
    }

    const renderSalesRep = (name) => {
      if (!name) return '';
      const rep = SALES_REPS[name.trim()];
      return `
        <div class="sales-rep-block">
          <div><b>MSR Sales Rep:</b> ${name}</div>
          ${rep ? `
            <div><b>Phone:</b> <a href="tel:${rep.phone.replace(/\D/g, '')}">${rep.phone}</a></div>
            <div><b>Email:</b> <a href="mailto:${rep.email}">${rep.email}</a></div>
          ` : ''}
        </div>
      `;
    };

    list.innerHTML = shown.map((c) => {
      const nameHtml = ATTORNEY_NOTES[c.name]
        ? `<span class="contact-name has-scheduling-notes" data-notes-key="attorney::${c.name}" tabindex="0">${c.name} <span class="provider-note-indicator" aria-hidden="true">&#9432;</span></span>`
        : `<span class="contact-name">${c.name || '(No name)'}</span>`;
      const companyHtml = c.company
        ? (FIRM_NOTES[c.company]
            ? `<span class="contact-company has-scheduling-notes" data-notes-key="firm::${c.company}" tabindex="0">${c.company} <span class="provider-note-indicator" aria-hidden="true">&#9432;</span></span>`
            : `<span class="contact-company">${c.company}</span>`)
        : '';
      return `
      <li class="contact-card">
        <div class="contact-main">
          ${nameHtml}
          ${c.title ? `<span class="contact-title">${c.title}</span>` : ''}
          ${companyHtml}
        </div>
        <div class="contact-details">
          ${c.phone ? `<div class="contact-detail"><b>Phone:</b> <a href="tel:${c.phone.replace(/\D/g, '')}">${formatPhone(c.phone)}</a></div>` : ''}
          ${c.email ? `<div class="contact-detail"><b>Email:</b> <a href="mailto:${c.email}">${c.email}</a></div>` : ''}
          ${(c.city || c.state) ? `<div class="contact-detail"><b>Location:</b> ${[c.city, c.state].filter(Boolean).join(', ')}${c.zip ? ' ' + c.zip : ''}</div>` : ''}
          ${renderSalesRep(c.salesRep)}
        </div>
      </li>
    `;
    }).join('');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    currentQuery = input.value;
    render(currentQuery);
  });

  loadMoreBtn.addEventListener('click', () => {
    visibleCount += PAGE_SIZE;
    render(currentQuery, false);
  });

  fetch('contacts.json')
    .then((res) => {
      if (!res.ok) throw new Error('not found');
      return res.json();
    })
    .then((data) => {
      contacts = data;
      render('');
    })
    .catch(() => {
      render('');
    });
})();
