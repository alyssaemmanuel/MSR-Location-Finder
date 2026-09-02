(function () {
  let contacts = [];

  const list = document.querySelector('#contact-list');
  const status = document.querySelector('#results-status');
  const titleText = document.querySelector('#finder-title-text');
  const form = document.querySelector('#contact-search-form');
  const input = document.querySelector('#contact-search');
  const note = document.querySelector('#contact-search-note');

  const MAX_RESULTS = 100;

  const SALES_REPS = {
    'Jeffrey Rubin': { phone: '(516) 993-0070', email: 'jrubin@healthplusmgmt.com' },
    'Angela Lastihenos': { phone: '(516) 492-2884', email: 'angela@msrconcierge.com' },
    'Johanna Galabay': { phone: '(917) 825-1393', email: 'Johanna@msrconcierge.com' },
    'Joseph Barriga': { phone: '(516) 993-0071', email: 'jrubin@healthplusmgmt.com' },
  };

  const formatPhone = (phoneStr) => {
    if (!phoneStr) return '';
    const digits = phoneStr.replace(/\D/g, '');
    if (digits.length === 10) return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
    if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1, 4)}) ${digits.slice(4, 7)}-${digits.slice(7)}`;
    return phoneStr;
  };

  function render(query) {
    const q = (query || '').trim().toLowerCase();

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
      return;
    }

    const shown = matches.slice(0, MAX_RESULTS);
    status.textContent = matches.length > MAX_RESULTS
      ? `Showing top ${MAX_RESULTS} of ${matches.length} matches`
      : `${matches.length} ${matches.length === 1 ? 'contact' : 'contacts'} found`;

    if (shown.length === 0) {
      list.innerHTML = `<li class="contact-empty">No contacts match that search.</li>`;
      return;
    }

    const renderSalesRep = (name) => {
      if (!name) return '';
      const rep = SALES_REPS[name.trim()];
      if (!rep) return `<div class="contact-detail"><b>MSR Sales Rep:</b> ${name}</div>`;
      return `
        <div class="sales-rep-block">
          <div><b>MSR Sales Rep:</b> ${name}</div>
          <div><b>Phone:</b> <a href="tel:${rep.phone.replace(/\D/g, '')}">${rep.phone}</a></div>
          <div><b>Email:</b> <a href="mailto:${rep.email}">${rep.email}</a></div>
        </div>
      `;
    };

    list.innerHTML = shown.map((c) => `
      <li class="contact-card">
        <div class="contact-main">
          <span class="contact-name">${c.name || '(No name)'}</span>
          ${c.title ? `<span class="contact-title">${c.title}</span>` : ''}
          ${c.company ? `<span class="contact-company">${c.company}</span>` : ''}
        </div>
        <div class="contact-details">
          ${c.phone ? `<div class="contact-detail"><b>Phone:</b> <a href="tel:${c.phone.replace(/\D/g, '')}">${formatPhone(c.phone)}</a></div>` : ''}
          ${c.email ? `<div class="contact-detail"><b>Email:</b> <a href="mailto:${c.email}">${c.email}</a></div>` : ''}
          ${(c.city || c.state) ? `<div class="contact-detail"><b>Location:</b> ${[c.city, c.state].filter(Boolean).join(', ')}${c.zip ? ' ' + c.zip : ''}</div>` : ''}
          ${renderSalesRep(c.salesRep)}
        </div>
      </li>
    `).join('');
  }

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    render(input.value);
  });

  fetch('contacts.json')
    .then((res) => {
      if (!res.ok) throw new Error('not found');
      return res.json();
    })
    .then((data) => {
      contacts = data;
      note.textContent = `Leaving search blank shows the first ${MAX_RESULTS} contacts.`;
      render('');
    })
    .catch(() => {
      render('');
    });
})();
