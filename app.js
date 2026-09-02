    (function () {
      // Office data is loaded at runtime from offices.json
      let offices = [];

      // Coordinate fallbacks for immediate resolution
      const fallback = {
        '10001':[40.75,-73.997],'10016':[40.75,-73.98],'10033':[40.85,-73.94],
        '10451':[40.82,-73.92],'10461':[40.84,-73.83],'10463':[40.88,-73.90],
        '10605':[41.02,-73.76],'10801':[40.91,-73.78],'11106':[40.76,-73.93],
        '11201':[40.69,-73.99],'11207':[40.68,-73.91],'11226':[40.64,-73.96],
        '11232':[40.65,-74.01],'11234':[40.62,-73.92],'11235':[40.58,-73.95],
        '11374':[40.73,-73.86],'11426':[40.73,-73.72],'11516':[40.62,-73.73],
        '11550':[40.71,-73.62],'11566':[40.66,-73.55],'11570':[40.66,-73.64],
        '11580':[40.66,-73.70],'11590':[40.76,-73.57],'11729':[40.76,-73.33],
        '11763':[40.82,-72.99],'11787':[40.86,-73.20],'12524':[41.53,-73.90],
        '12550':[41.50,-74.02],'10512':[41.43,-73.68],'10549':[41.20,-73.73],
        '06810':[41.39,-73.45],'07047':[40.79,-74.03],'07666':[40.89,-74.01],
        '07719':[40.18,-74.02],'07726':[40.29,-74.34],'07728':[40.26,-74.28],
        '08755':[39.96,-74.20],'08831':[40.31,-74.43],'14094':[43.17,-78.69],
        '14120':[43.09,-78.88],'14127':[42.76,-78.75],'14209':[42.91,-78.87],
        '14221':[42.98,-78.73],'14226':[42.98,-78.80],'14301':[43.10,-79.06]
      };

      // UI Element References
      const form = document.querySelector('#zip-form');
      const input = document.querySelector('#zip');
      const note = document.querySelector('#zip-note');
      const list = document.querySelector('#office-list');
      const kicker = document.querySelector('#section-kicker');
      const titleText = document.querySelector('#finder-title-text');
      const searchedZip = document.querySelector('#searched-zip');
      const status = document.querySelector('#results-status');
      const submit = form.querySelector('button[type="submit"]');
      const showAllBtn = document.querySelector('#show-all-btn');
      const distanceNote = document.querySelector('#distance-note');
      const stateTabsContainer = document.querySelector('#state-filter-tabs');
      const subregionTabsContainer = document.querySelector('#subregion-filter-tabs');
      const providerFilterSelect = document.querySelector('#provider-filter-select');
      const legendOriginSpan = document.querySelector('#legend-search-origin');

      // Toast Notification
      const toastNotify = document.querySelector('#toast-notify');
      const toastMessage = document.querySelector('#toast-message');
      let toastTimer = null;

      function showToast(msg) {
        if (!toastNotify) return;
        toastMessage.textContent = msg;
        toastNotify.classList.add('show');
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => {
          toastNotify.classList.remove('show');
        }, 3500);
      }

      // State Variables
      let results = [];
      let currentSearch = '';
      let currentOrigin = null;
      let currentSelectedState = 'ALL';
      let currentSelectedSubregion = 'ALL';
      let currentSelectedProvider = 'ALL';
      let isShowAll = true;
      let activeOffice = null;
      let leafletMap = null;
      let officeMarkers = [];
      let originMarker = null;
      let originHalo = null;

      const makeDefaultPinIcon = (number) => L.divIcon({
        className: 'custom-office-pin',
        html: `
          <svg width="26" height="34" viewBox="0 0 26 34" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 2px 4px rgba(15, 23, 42, 0.25)); cursor: pointer;">
            <path d="M13 0C5.82 0 0 5.82 0 13C0 22.75 13 34 13 34C13 34 26 22.75 26 13C26 5.82 20.18 0 13 0Z" fill="#0179bf"/>
            <path d="M13 1.5C6.65 1.5 1.5 6.65 1.5 13C1.5 21.6 13 31.8 13 31.8C13 31.8 24.5 21.6 24.5 13C24.5 6.65 19.35 1.5 13 1.5Z" fill="#005a8f"/>
            <circle cx="13" cy="13" r="7.5" fill="#FFFFFF"/>
            <text x="13" y="13" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="8.5" font-weight="800" fill="#0179bf">${number}</text>
          </svg>
        `,
        iconSize: [26, 34],
        iconAnchor: [13, 34],
        popupAnchor: [0, -32]
      });

      const makeActivePinIcon = (number) => L.divIcon({
        className: 'custom-active-pin',
        html: `
          <svg width="34" height="44" viewBox="0 0 34 44" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 8px rgba(1, 121, 191, 0.4)); cursor: pointer;">
            <path d="M17 0C7.6 0 0 7.6 0 17C0 29.8 17 44 17 44C17 44 34 29.8 34 17C34 7.6 26.4 0 17 0Z" fill="#0179bf"/>
            <path d="M17 2C8.7 2 2 8.7 2 17C2 28.2 17 41.5 17 41.5C17 41.5 32 28.2 32 17C32 8.7 25.3 2 17 2Z" fill="#004670"/>
            <circle cx="17" cy="17" r="10" fill="#FFFFFF"/>
            <text x="17" y="17" text-anchor="middle" dominant-baseline="central" font-family="Arial, sans-serif" font-size="11" font-weight="800" fill="#0179bf">${number}</text>
          </svg>
        `,
        iconSize: [34, 44],
        iconAnchor: [17, 44],
        popupAnchor: [0, -40]
      });

      const originPinIcon = L.divIcon({
        className: 'custom-origin-pin',
        html: `
          <svg width="32" height="42" viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 4px 8px rgba(217, 119, 6, 0.45)); cursor: pointer;">
            <path d="M16 0C7.2 0 0 7.2 0 16C0 28 16 42 16 42C16 42 32 28 32 16C32 7.2 24.8 0 16 0Z" fill="#d97706"/>
            <circle cx="16" cy="16" r="6" fill="#FFFFFF"/>
            <circle cx="16" cy="16" r="3" fill="#d97706"/>
          </svg>
        `,
        iconSize: [32, 42],
        iconAnchor: [16, 42],
        popupAnchor: [0, -38]
      });

      function initMap() {
        if (leafletMap) return;
        const container = document.getElementById('map-frame');
        if (!container) return;
        
        leafletMap = L.map('map-frame', {
          center: [40.85, -73.85],
          zoom: 9,
          zoomControl: false
        });

        L.control.zoom({ position: 'bottomright' }).addTo(leafletMap);

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 19,
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
        }).addTo(leafletMap);

        setTimeout(() => {
          if (leafletMap) leafletMap.invalidateSize();
        }, 200);
      }

      const rad = (value) => value * Math.PI / 180;
      const miles = (aLat, aLon, bLat, bLon) => {
        const dLat = rad(bLat - aLat), dLon = rad(bLon - aLon);
        const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(aLat)) * Math.cos(rad(bLat)) * Math.sin(dLon / 2) ** 2;
        return 7917.6 * Math.asin(Math.sqrt(h));
      };

      const formatPhone = (phoneStr) => {
        if (!phoneStr) return '';
        const digits = phoneStr.replace(/\D/g, '');
        if (digits.length === 10) return `(${digits.slice(0,3)}) ${digits.slice(3,6)}-${digits.slice(6)}`;
        if (digits.length === 11 && digits.startsWith('1')) return `(${digits.slice(1,4)}) ${digits.slice(4,7)}-${digits.slice(7)}`;
        return phoneStr;
      };

      const formatHours = (hoursStr) => {
        if (!hoursStr) return '';
        return hoursStr
          .replace(/\s*\(([^)]+)\)/g, ', $1')
          .split(/,\s*(?=[A-Za-z/–-]+:|[A-Za-z/–-]+\s*Closed)/gi)
          .map(line => line.trim())
          .filter(Boolean)
          .join('<br>');
      };

      const defaultTagRenderer = (name) => `<span class="insurance-tag">${name}</span>`;

      const renderTagSection = (sectionId, label, items, unavailableText, tagRenderer = defaultTagRenderer) => {
        const hasItems = items && items.length;
        return `
          <button type="button" class="insurance-toggle" data-target="${sectionId}" aria-expanded="false">
            ${label}${hasItems ? ` (${items.length})` : ''}
            <span class="insurance-toggle-icon" aria-hidden="true">&#9662;</span>
          </button>
          <div class="insurance-tags" id="${sectionId}" hidden>
            ${hasItems ? items.map(tagRenderer).join('') : `<span class="insurance-unavailable">${unavailableText}</span>`}
          </div>
        `;
      };

      const PROVIDER_NOTES = {
        'Mike Pappas, DO': [
          { text: 'All new patients should be scheduled only with Dr. Pappas.', sub: [
            'Patients must arrive 15–20 minutes prior to their appointment to complete the required paperwork.'
          ] },
          { label: 'Translation', text: 'If a patient requires translation services, they must be accompanied by a translator, except for Spanish-speaking patients, as we have Spanish translators available to assist them.' },
          { label: 'Age Restriction', text: 'Patients must be 14 years of age or older. Patients under 18 must be accompanied by a parent or legal guardian who is 18 years of age or older.' },
          { label: 'Appointment Intervals', text: '20-minute intervals. Double-booking is permitted when needed, except during the last 1–2 appointment slots of the day.' },
          { text: 'No police brutality cases.' },
          { text: 'Dr. Pappas is the only provider that is INN w/ most MM insurances.' },
          { text: 'Fruma, the PA, may examine the established NF/Lien. She can see established WC patients as well, however, Dr. Pappas must be in the office.' },
        ],
      };

      const providerTagRenderer = (entry) => {
        const name = providerNameOnly(entry);
        const notes = PROVIDER_NOTES[name];
        if (!notes) return `<span class="insurance-tag provider-tag">${entry}</span>`;
        return `<span class="insurance-tag provider-tag provider-tag-has-notes" data-provider="${name}" tabindex="0">${entry} <span class="provider-note-indicator" aria-hidden="true">&#9432;</span></span>`;
      };

      const renderNoteItem = (item) => `
        <li>
          ${item.label ? `<b>${item.label}:</b> ` : ''}${item.text}
          ${item.sub ? `<ul>${item.sub.map(s => `<li>${s}</li>`).join('')}</ul>` : ''}
        </li>
      `;

      const providerTooltip = document.createElement('div');
      providerTooltip.className = 'provider-tooltip';
      providerTooltip.hidden = true;
      document.body.appendChild(providerTooltip);

      function showProviderTooltip(target) {
        const name = target.dataset.provider;
        const notes = PROVIDER_NOTES[name];
        if (!notes) return;
        providerTooltip.innerHTML = `
          <div class="provider-tooltip-title">${name}</div>
          <div class="provider-tooltip-kicker">Scheduling Notes</div>
          <ul class="provider-tooltip-list">${notes.map(renderNoteItem).join('')}</ul>
        `;
        providerTooltip.hidden = false;

        const rect = target.getBoundingClientRect();
        const tooltipRect = providerTooltip.getBoundingClientRect();
        let left = rect.left + window.scrollX;
        let top = rect.bottom + window.scrollY + 8;
        if (left + tooltipRect.width > window.scrollX + document.documentElement.clientWidth - 12) {
          left = window.scrollX + document.documentElement.clientWidth - tooltipRect.width - 12;
        }
        if (top + tooltipRect.height > window.scrollY + window.innerHeight - 12) {
          top = rect.top + window.scrollY - tooltipRect.height - 8;
        }
        providerTooltip.style.left = `${Math.max(12, left)}px`;
        providerTooltip.style.top = `${Math.max(12, top)}px`;
      }

      function hideProviderTooltip() {
        providerTooltip.hidden = true;
      }

      document.addEventListener('mouseover', (e) => {
        const tag = e.target.closest('.provider-tag-has-notes');
        if (tag) showProviderTooltip(tag);
      });
      document.addEventListener('mouseout', (e) => {
        const tag = e.target.closest('.provider-tag-has-notes');
        if (tag && !tag.contains(e.relatedTarget)) hideProviderTooltip();
      });
      document.addEventListener('focusin', (e) => {
        const tag = e.target.closest('.provider-tag-has-notes');
        if (tag) showProviderTooltip(tag);
      });
      document.addEventListener('focusout', (e) => {
        const tag = e.target.closest('.provider-tag-has-notes');
        if (tag) hideProviderTooltip();
      });

      const gmbUrl = (office, origin = currentSearch) => {
        if (office.gmbUrl) {
          return office.gmbUrl;
        }
        // Strip parenthetical notes (e.g. "(Entry on 39th St)") - useful for staff to read,
        // but they confuse Google's address geocoder when included in the destination query.
        const cleanAddress = office.address.replace(/\s*\([^)]*\)/g, '').trim();
        const destination = encodeURIComponent(`${office.practice}, ${cleanAddress}, ${office.city}, ${office.state} ${office.zip}`);
        const originParam = origin ? `&origin=${encodeURIComponent(origin)}` : '';
        return `https://www.google.com/maps/dir/?api=1${originParam}&destination=${destination}`;
      };

      function populateSubregionTabs() {
        let pool = offices;
        if (currentSelectedState !== 'ALL') {
          pool = offices.filter(o => o.state === currentSelectedState);
        }

        const uniqueRegions = [...new Set(pool.map(o => o.region))].sort();

        let tabsHtml = `
          <button type="button" class="filter-tab-btn ${currentSelectedSubregion === 'ALL' ? 'active' : ''}" data-subregion="ALL">
            All Regions <span class="count">(${pool.length})</span>
          </button>
        `;

        uniqueRegions.forEach(reg => {
          const count = pool.filter(o => o.region === reg).length;
          const isActive = currentSelectedSubregion === reg;
          tabsHtml += `
            <button type="button" class="filter-tab-btn ${isActive ? 'active' : ''}" data-subregion="${reg}">
              ${reg} <span class="count">(${count})</span>
            </button>
          `;
        });

        subregionTabsContainer.innerHTML = tabsHtml;
      }

      const providerNameOnly = (entry) => entry.replace(/\s*\([^)]*\)\s*$/, '').trim();

      function populateProviderFilter() {
        let pool = offices;
        if (currentSelectedState !== 'ALL') {
          pool = pool.filter(o => o.state === currentSelectedState);
        }
        if (currentSelectedSubregion !== 'ALL') {
          pool = pool.filter(o => o.region === currentSelectedSubregion);
        }

        const uniqueNames = [...new Set(
          pool.flatMap(o => (o.providers || []).map(providerNameOnly))
        )].sort((a, b) => a.localeCompare(b));

        if (currentSelectedProvider !== 'ALL' && !uniqueNames.includes(currentSelectedProvider)) {
          currentSelectedProvider = 'ALL';
        }

        providerFilterSelect.innerHTML = `<option value="ALL">All Providers</option>` +
          uniqueNames.map(name => `<option value="${name}">${name}</option>`).join('');
        providerFilterSelect.value = currentSelectedProvider;
      }

      providerFilterSelect.addEventListener('change', () => {
        currentSelectedProvider = providerFilterSelect.value;
        render(currentOrigin, currentSearch);
      });

      stateTabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-state]');
        if (!btn) return;
        stateTabsContainer.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSelectedState = btn.dataset.state;
        currentSelectedSubregion = 'ALL';
        populateSubregionTabs();
        populateProviderFilter();
        render(currentOrigin, currentSearch);
      });

      subregionTabsContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-subregion]');
        if (!btn) return;
        subregionTabsContainer.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        currentSelectedSubregion = btn.dataset.subregion;
        populateProviderFilter();
        render(currentOrigin, currentSearch);
      });

      function selectOffice(index, focusMap) {
        const office = results[index];
        if (!office) return;
        activeOffice = office;
        document.querySelectorAll('.office-list li').forEach((item, itemIndex) => item.classList.toggle('active', itemIndex === index));
        
        document.querySelector('#map-name').textContent = office.name;
        document.querySelector('#map-practice').textContent = `${office.practice} • ${office.address}, ${office.city}`;
        document.querySelector('#map-learn-link').href = office.url;
        
        const toolbarActions = document.querySelector('.map-toolbar-actions');
        if (toolbarActions) toolbarActions.classList.add('visible');
        
        if (!leafletMap) initMap();

        officeMarkers.forEach((m, mIdx) => {
          if (mIdx === index) {
            m.setIcon(makeActivePinIcon(mIdx + 1));
            m.setZIndexOffset(1000);
            m.openPopup();
          } else {
            m.setIcon(makeDefaultPinIcon(mIdx + 1));
            m.setZIndexOffset(0);
          }
        });

        leafletMap.setView([office.lat, office.lon], Math.max(leafletMap.getZoom(), 12), { animate: true });
        
        if (focusMap && window.innerWidth < 900) {
          document.querySelector('.map-panel').scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }

      function toBold(str) {
        return Array.from(str).map(char => {
          const code = char.charCodeAt(0);
          if (code >= 65 && code <= 90) return String.fromCodePoint(0x1D5D4 + (code - 65));
          if (code >= 97 && code <= 122) return String.fromCodePoint(0x1D5EE + (code - 97));
          if (code >= 48 && code <= 57) return String.fromCodePoint(0x1D7EC + (code - 48));
          return char;
        }).join('');
      }

      function buildPlainTextConfirmation(office) {
        const fullAddress = `${office.address}, ${office.city}, ${office.state} ${office.zip}`;
        const gmbLink = office.gmbUrl || gmbUrl(office);

        return `Hello,\r\n\r\n` +
          `We’re happy to confirm the appointment below:\r\n\r\n` +
          `${toBold("Patient:")} [Patient Full Name]\r\n` +
          `${toBold("Appointment Date:")} [Day, Date]\r\n` +
          `${toBold("Appointment Time:")} [Time]\r\n` +
          `${toBold("Practice:")} ${office.practice}\r\n` +
          `${toBold("Address:")} ${fullAddress}\r\n` +
          `${gmbLink}\r\n\r\n` +
          `${toBold("For the Patient")}\r\n` +
          `Your appointment is confirmed! We look forward to welcoming you.\r\n\r\n` +
          `Please remember to bring your ${toBold("photo ID")}, along with any documents you have available related to your injury, including:\r\n\r\n` +
          `  • Police report\r\n` +
          `  • Ambulance report\r\n` +
          `  • Medical records\r\n` +
          `  • Diagnostic testing or imaging\r\n\r\n` +
          `If you have any questions or need assistance before your visit, please don’t hesitate to reach out.\r\n\r\n` +
          `${toBold("For the Practice Team")}\r\n` +
          `The patient’s intake sheet is attached to this email. Please enter the information into ${toBold("NextGen EHR")} in preparation for the upcoming visit. Thank you for helping us ensure a smooth experience for the patient.\r\n\r\n` +
          `${toBold("For the Representing Attorney")}\r\n` +
          `Thank you for your support as we welcome this patient to the practice. We appreciate the opportunity to assist and look forward to keeping you informed along the way.\r\n\r\n` +
          `Thank you, everyone, for helping us create a welcoming and seamless experience for the patient.\r\n\r\n` +
          `Warmly,\r\n` +
          `${toBold("Patient Access Team")}`;
      }

      function buildHtmlConfirmation(office) {
        const fullAddress = `${office.address}, ${office.city}, ${office.state} ${office.zip}`;
        const gmbLink = office.gmbUrl || gmbUrl(office);

        return `<div style="font-family: Calibri, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #000000;">` +
          `<p style="margin: 0 0 14px;">Hello,</p>` +
          `<p style="margin: 0 0 14px;">We’re happy to confirm the appointment below:</p>` +
          `<p style="margin: 0 0 16px; line-height: 1.6;">` +
            `<strong>Patient:</strong> [Patient Full Name]<br>` +
            `<strong>Appointment Date:</strong> [Day, Date]<br>` +
            `<strong>Appointment Time:</strong> [Time]<br>` +
            `<strong>Practice:</strong> ${office.practice}<br>` +
            `<strong>Address:</strong> <a href="${gmbLink}" target="_blank" style="color: #0179bf; text-decoration: underline; font-weight: 600;">${fullAddress}</a>` +
          `</p>` +
          `<p style="margin: 0 0 4px;"><strong>For the Patient</strong></p>` +
          `<p style="margin: 0 0 14px;">Your appointment is confirmed! We look forward to welcoming you.</p>` +
          `<p style="margin: 0 0 8px;">Please remember to bring your <strong>photo ID</strong>, along with any documents you have available related to your injury, including:</p>` +
          `<ul style="margin: 0 0 14px; padding-left: 24px;">` +
            `<li style="margin-bottom: 3px;">Police report</li>` +
            `<li style="margin-bottom: 3px;">Ambulance report</li>` +
            `<li style="margin-bottom: 3px;">Medical records</li>` +
            `<li style="margin-bottom: 3px;">Diagnostic testing or imaging</li>` +
          `</ul>` +
          `<p style="margin: 0 0 16px;">If you have any questions or need assistance before your visit, please don’t hesitate to reach out.</p>` +
          `<p style="margin: 0 0 4px;"><strong>For the Practice Team</strong></p>` +
          `<p style="margin: 0 0 16px;">The patient’s intake sheet is attached to this email. Please enter the information into <strong>NextGen EHR</strong> in preparation for the upcoming visit. Thank you for helping us ensure a smooth experience for the patient.</p>` +
          `<p style="margin: 0 0 4px;"><strong>For the Representing Attorney</strong></p>` +
          `<p style="margin: 0 0 14px;">Thank you for your support as we welcome this patient to the practice. We appreciate the opportunity to assist and look forward to keeping you informed along the way.</p>` +
          `<p style="margin: 0 0 16px;">Thank you, everyone, for helping us create a welcoming and seamless experience for the patient.</p>` +
          `<p style="margin: 0;">Warmly,<br><strong>Patient Access Team</strong></p>` +
        `</div>`;
      }

      function copyRichAndPlainText(htmlStr, plainStr) {
        try {
          const listener = function(e) {
            e.clipboardData.setData('text/html', htmlStr);
            e.clipboardData.setData('text/plain', plainStr);
            e.preventDefault();
          };
          document.addEventListener('copy', listener);
          document.execCommand('copy');
          document.removeEventListener('copy', listener);
        } catch (err) {
          if (navigator.clipboard && window.ClipboardItem) {
            const htmlBlob = new Blob([htmlStr], { type: 'text/html' });
            const textBlob = new Blob([plainStr], { type: 'text/plain' });
            navigator.clipboard.write([
              new ClipboardItem({ 'text/html': htmlBlob, 'text/plain': textBlob })
            ]).catch(() => {});
          }
        }
      }

      function directLaunchAppointmentEmail(office) {
        if (!office) return;
        const subject = `Your Appointment Confirmation Details | ${office.practice}`;
        const plainText = buildPlainTextConfirmation(office);
        const htmlText = buildHtmlConfirmation(office);
        
        // 1. Copy rich HTML to clipboard so user can also Ctrl+V anywhere
        copyRichAndPlainText(htmlText, plainText);

        showToast(`Opening Outlook...`);

        // 2. Generate an Outlook-compatible HTML draft file (.eml) with hyperlinked address
        try {
          const emlContent = 
            `X-Unsent: 1\r\n` +
            `To: \r\n` +
            `Subject: ${subject}\r\n` +
            `MIME-Version: 1.0\r\n` +
            `Content-Type: text/html; charset=utf-8\r\n` +
            `\r\n` +
            `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body>${htmlText}</body></html>`;

          const blob = new Blob([emlContent], { type: 'message/rfc822' });
          const url = URL.createObjectURL(blob);
          const tempLink = document.createElement('a');
          tempLink.href = url;
          tempLink.download = `Appointment_Confirmation_${office.name.replace(/[^a-zA-Z0-9]/g, '_')}.eml`;
          document.body.appendChild(tempLink);
          tempLink.click();

          setTimeout(() => {
            if (tempLink.parentNode) tempLink.parentNode.removeChild(tempLink);
            URL.revokeObjectURL(url);
          }, 1500);
        } catch (err) {
          // Fallback to mailto if blob/download is restricted
          const mailtoUrl = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(plainText)}`;
          window.location.href = mailtoUrl;
        }
      }

      function updateMap(displayedOffices, origin) {
        initMap();
        if (!leafletMap) return;

        // Clear existing markers
        officeMarkers.forEach(m => leafletMap.removeLayer(m));
        officeMarkers = [];

        if (originMarker) {
          leafletMap.removeLayer(originMarker);
          originMarker = null;
        }
        if (originHalo) {
          leafletMap.removeLayer(originHalo);
          originHalo = null;
        }

        const bounds = L.latLngBounds();

        // Add origin marker if searched
        if (origin && Array.isArray(origin) && origin.length === 2) {
          originMarker = L.marker([origin[0], origin[1]], { icon: originPinIcon, zIndexOffset: 800 }).addTo(leafletMap);
          originMarker.bindPopup(`<strong style="color: var(--amber);">Searched Location</strong><br>${currentSearch}`);
          bounds.extend([origin[0], origin[1]]);

          originHalo = L.circle([origin[0], origin[1]], {
            radius: 4000,
            color: '#d97706',
            fillColor: '#f59e0b',
            fillOpacity: 0.1,
            weight: 1.5
          }).addTo(leafletMap);

          legendOriginSpan.style.display = 'flex';
        } else {
          legendOriginSpan.style.display = 'none';
        }

        // Add office markers
        displayedOffices.forEach((office, idx) => {
          const marker = L.marker([office.lat, office.lon], { icon: makeDefaultPinIcon(idx + 1) }).addTo(leafletMap);
          marker.bindPopup(`
            <div style="font-family: inherit; font-size: 13px;">
              <strong style="color: var(--blue); font-size: 14px;">${office.name}</strong><br>
              <span style="color: var(--slate-600);">${office.practice}</span><br>
              <span style="color: var(--slate-800);">${office.address}, ${office.city}</span><br>
              ${office.distance !== undefined ? `<span style="display:inline-block; margin-top:4px; font-weight:700; color:var(--blue);">${office.distance.toFixed(1)} miles away</span>` : ''}
            </div>
          `);

          marker.on('click', () => {
            selectOffice(idx, true);
          });

          bounds.extend([office.lat, office.lon]);
          officeMarkers.push(marker);
        });

        if (bounds.isValid()) {
          leafletMap.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
        }
      }

      function render(origin, query, toggleShowAll = false) {
        currentOrigin = origin;
        currentSearch = query || '';

        // 1. Filter offices based on state and region
        let pool = offices.slice();
        if (currentSelectedState !== 'ALL') {
          pool = pool.filter(o => o.state === currentSelectedState);
        }
        if (currentSelectedSubregion !== 'ALL') {
          pool = pool.filter(o => o.region === currentSelectedSubregion);
        }
        if (currentSelectedProvider !== 'ALL') {
          pool = pool.filter(o => (o.providers || []).some(p => providerNameOnly(p) === currentSelectedProvider));
        }

        // 2. Compute distance if origin is provided
        if (origin && Array.isArray(origin) && origin.length === 2) {
          pool.forEach(o => {
            o.distance = miles(origin[0], origin[1], o.lat, o.lon);
          });
          pool.sort((a, b) => a.distance - b.distance);
        } else {
          pool.forEach(o => { delete o.distance; });
        }

        results = pool;

        // Update Section Title & Kicker
        const isFiltered = currentSelectedState !== 'ALL' || currentSelectedSubregion !== 'ALL' || currentSelectedProvider !== 'ALL';
        if (query) {
          kicker.textContent = 'PROXIMITY SEARCH RESULTS';
          titleText.textContent = 'Offices near';
          searchedZip.textContent = ` ${query}`;
          searchedZip.style.display = 'inline';
          status.textContent = `${results.length} ${results.length === 1 ? 'location' : 'locations'} sorted by distance`;
          distanceNote.style.display = 'block';
        } else if (isFiltered) {
          kicker.textContent = currentSelectedProvider !== 'ALL' ? 'PROVIDER RESULTS' : 'REGIONAL DIRECTORY';
          titleText.textContent = currentSelectedProvider !== 'ALL' ? currentSelectedProvider : (currentSelectedSubregion !== 'ALL' ? currentSelectedSubregion : (currentSelectedState === 'NY' ? 'New York' : currentSelectedState === 'NJ' ? 'New Jersey' : 'Connecticut'));
          searchedZip.textContent = '';
          searchedZip.style.display = 'none';
          status.textContent = `Showing ${results.length} of 47 locations`;
          distanceNote.style.display = 'none';
        } else {
          kicker.textContent = 'CLINICAL DIRECTORY';
          titleText.textContent = 'All Office Locations';
          searchedZip.textContent = '';
          searchedZip.style.display = 'none';
          status.textContent = `Showing all 47 office locations`;
          distanceNote.style.display = 'none';
        }

        // Handle visibility limit (show 5 nearest if searched, unless isShowAll is true)
        const shouldLimit = !isShowAll && query && results.length > 5;
        const displayed = shouldLimit ? results.slice(0, 5) : results;

        if (shouldLimit) {
          showAllBtn.style.display = 'inline-flex';
          showAllBtn.innerHTML = `Show all ${results.length} offices &darr;`;
        } else if (query && results.length > 5 && isShowAll) {
          showAllBtn.style.display = 'inline-flex';
          showAllBtn.innerHTML = `Show top 5 closest &uarr;`;
        } else {
          showAllBtn.style.display = 'none';
        }

        // Render HTML for Office List
        if (displayed.length === 0) {
          list.innerHTML = `<li style="padding: 24px; text-align: center; color: var(--slate-500);">No office locations found matching the selected filter.</li>`;
        } else {
          list.innerHTML = displayed.map((office, idx) => {
            const gmb = gmbUrl(office, query);
            const isDistance = office.distance !== undefined;
            const isThirdPartyScheduling = /Somers Orthopaedic|Advanced Orthopedics and Sports Medicine Institute/.test(office.practice);
            const formattedHours = formatHours(office.hours);
            const phoneClean = formatPhone(office.phone);
            const directClean = office.directPhone ? formatPhone(office.directPhone) : '';
            const escalationPhone = office.escalationPhone ? formatPhone(office.escalationPhone) : '';

            return `
              <li data-index="${idx}" class="${idx === 0 ? 'active' : ''}">
                <button type="button" class="office-select" data-index="${idx}">
                  <span class="result-number">${idx + 1}</span>
                  <div class="office-details">
                    <span class="town-name">${office.name}</span>
                    <span class="office-practice">${office.practice}</span>
                    <span class="office-address-text">${office.address}, ${office.city}, ${office.state} ${office.zip}</span>
                    ${isThirdPartyScheduling ? `<div class="scheduling-flag"><span aria-hidden="true">&#128681;</span> Scheduling is handled by the office directly &mdash; collect full name &amp; contact information and hand off to the Office Manager.</div>` : ''}
                    <div class="office-split-container">
                      <div class="split-col">
                        <span class="split-col-title">OFFICE INFORMATION</span>
                        <div class="split-row">
                          <b>Office Manager:</b><br>
                          <span>${office.manager}</span>
                        </div>
                        <div class="split-row">
                          <b>Hours:</b><br>
                          <span>${formattedHours}</span>
                        </div>
                        <div class="split-row">
                          <b>Medical Records Email:</b>
                          <a href="mailto:${office.medEmail}">${office.medEmail}</a>
                        </div>
                      </div>
                      <div class="split-col">
                        <span class="split-col-title">CONTACT INFORMATION</span>
                        <div class="split-row">
                          <b>For help with appointment requests call main line:</b><br>
                          <a href="tel:${office.phone.replace(/\D/g, '')}">${phoneClean}</a>
                          ${office.directPhone ? `<br><a href="tel:${office.directPhone.replace(/\D/g, '')}">${directClean}</a>` : ''}
                        </div>
                        <div class="split-row">
                          <b>Non-Appointment Requests:</b><br>
                          <span>${office.escalation}:</span><br>
                          ${office.escalationPhone ? `<a href="tel:${office.escalationPhone.replace(/\D/g, '')}">${escalationPhone}</a>` : ''}
                        </div>
                      </div>
                    </div>
                  </div>
                  ${isDistance ? `<div class="distance"><strong>${office.distance.toFixed(1)}</strong><small>miles</small></div>` : ''}
                </button>
                ${(() => {
                  const noFaultLabel = office.state === 'NJ' ? 'PIP' : 'No-Fault';
                  const allInsurances = [noFaultLabel, `Workers' Comp`, ...(office.insurances || [])];
                  return `
                <div class="office-insurance-row">
                  <button type="button" class="insurance-toggle" data-target="insurance-tags-${idx}" aria-expanded="false">
                    Insurances Accepted (${allInsurances.length})
                    <span class="insurance-toggle-icon" aria-hidden="true">&#9662;</span>
                  </button>
                  <div class="insurance-tags" id="insurance-tags-${idx}" hidden>
                    ${allInsurances.map(name => `<span class="insurance-tag">${name}</span>`).join('')}
                    ${office.insurances && office.insurances.length ? '' : `<span class="insurance-unavailable">Other insurances unavailable for this location &mdash; call office to confirm.</span>`}
                  </div>
                </div>
                <div class="office-insurance-row">
                  ${renderTagSection(`providers-tags-${idx}`, 'Providers at This Location', office.providers, 'Provider information not yet available for this location.', providerTagRenderer)}
                </div>
                <div class="office-insurance-row">
                  ${renderTagSection(`services-tags-${idx}`, 'Services at This Location', office.services, 'Service information not yet available for this location.')}
                </div>
                  `;
                })()}
                <div class="office-actions">
                  <button type="button" class="btn-confirm-appt" data-index="${idx}">Appointment Confirmation <span aria-hidden="true">&nearr;</span></button>
                  <a class="btn-learn-more" href="${office.url}" target="_blank" rel="noreferrer">Learn More About Location <span aria-hidden="true">&nearr;</span></a>
                </div>
              </li>
            `;
          }).join('');
        }

        // Update Leaflet Map Markers
        updateMap(displayed, origin);

        // Auto-select first item
        if (displayed.length > 0) {
          selectOffice(0, false);
        }
      }

      document.querySelector('#map-confirm-btn').addEventListener('click', () => {
        if (activeOffice) directLaunchAppointmentEmail(activeOffice);
      });

      showAllBtn.addEventListener('click', () => {
        isShowAll = !isShowAll;
        render(currentOrigin, currentSearch, true);
      });

      list.addEventListener('click', (event) => {
        const confirmBtn = event.target.closest('.btn-confirm-appt');
        if (confirmBtn) {
          const idx = Number(confirmBtn.dataset.index);
          const office = results[idx];
          if (office) directLaunchAppointmentEmail(office);
          return;
        }

        const tagToggle = event.target.closest('.insurance-toggle');
        if (tagToggle) {
          const tagsEl = document.getElementById(tagToggle.dataset.target);
          if (tagsEl) {
            tagsEl.hidden = !tagsEl.hidden;
            tagToggle.setAttribute('aria-expanded', tagsEl.hidden ? 'false' : 'true');
          }
          return;
        }

        const button = event.target.closest('.office-select');
        if (button) selectOffice(Number(button.dataset.index), window.innerWidth < 640);
      });

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        const query = input.value.trim();

        if (!query) {
          note.className = 'privacy-note';
          note.textContent = 'Leaving search blank populates all 47 offices. Distance is calculated from searched coordinates.';
          currentSelectedState = 'ALL';
          currentSelectedSubregion = 'ALL';
          currentSelectedProvider = 'ALL';
          stateTabsContainer.querySelectorAll('.filter-tab-btn').forEach(b => b.classList.toggle('active', b.dataset.state === 'ALL'));
          populateSubregionTabs();
          populateProviderFilter();
          isShowAll = true;
          render(null, '');
          document.querySelector('#finder').scrollIntoView({ behavior: 'smooth' });
          return;
        }

        const isZip = /^\d{5}$/.test(query);
        submit.disabled = true;
        submit.innerHTML = 'Searching… &rarr;';
        note.className = 'privacy-note';
        note.textContent = 'Finding nearby offices…';

        let coordinate = isZip ? fallback[query] : undefined;
        try {
          if (isZip && !coordinate) {
            const response = await fetch(`https://api.zippopotam.us/us/${query}`);
            if (!response.ok) throw new Error('not found');
            const data = await response.json(), place = data.places && data.places[0];
            coordinate = [Number(place.latitude), Number(place.longitude)];
          } else if (!isZip) {
            const params = new URLSearchParams({ format: 'jsonv2', countrycodes: 'us', limit: '1', q: query });
            const response = await fetch(`https://nominatim.openstreetmap.org/search?${params}`);
            if (!response.ok) throw new Error('not found');
            const data = await response.json();
            if (!data[0]) throw new Error('not found');
            coordinate = [Number(data[0].lat), Number(data[0].lon)];
          }
        } catch {
          if (isZip) {
            const office = offices.find((item) => item.zip === query);
            if (office) coordinate = [office.lat, office.lon];
          }
        }

        submit.disabled = false;
        submit.innerHTML = 'Find offices &rarr;';

        if (!coordinate || coordinate.some(Number.isNaN)) {
          note.className = 'form-error';
          note.textContent = 'We could not locate that address or ZIP code. Check your spelling or search by borough below.';
          return;
        }

        note.className = 'privacy-note';
        note.textContent = 'Proximity calculated from searched location. Offices sorted by distance.';
        isShowAll = false;
        render(coordinate, query);
        document.querySelector('#finder').scrollIntoView({ behavior: 'smooth' });
      });

      function initApp() {
        fetch('offices.json')
          .then((res) => res.json())
          .then((data) => {
            offices = data;
            populateSubregionTabs();
            populateProviderFilter();
            render(null, '');
          })
          .catch((err) => {
            console.error('Failed to load office data', err);
            list.innerHTML = '<li style="padding: 24px; text-align: center; color: var(--slate-500);">Unable to load office data. Please refresh the page.</li>';
          });
      }

      initApp();
    })();