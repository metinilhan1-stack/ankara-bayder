/* Copy each account detail independently; leave text selectable without clipboard access. */
(function () {
  var status = document.getElementById('donation-status');
  if (!status) return;
  function fallbackCopy(value) {
    var active = document.activeElement;
    var input = document.createElement('textarea');
    input.value = value;
    input.readOnly = true;
    input.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;font-size:16px;';
    document.body.appendChild(input);
    try {
      input.focus({ preventScroll: true });
      input.select();
      input.setSelectionRange(0, input.value.length);
      return document.execCommand('copy');
    } catch (error) {
      return false;
    } finally {
      input.remove();
      if (active && active.focus) active.focus({ preventScroll: true });
    }
  }
  document.querySelectorAll('[data-copy-target]').forEach(function (button) {
    var field = document.getElementById(button.dataset.copyTarget);
    if (!field) return;
    button.hidden = false;
    button.addEventListener('click', async function () {
      var label = button.dataset.copyLabel;
      var value = field.textContent.trim().replace(/\s+/g, ' ');
      button.disabled = true;
      if (field.id === 'donation-iban') value = value.replace(/\s/g, '');
      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(value);
        } else if (!fallbackCopy(value)) {
          throw new Error('Clipboard unavailable');
        }
        status.textContent = label + ' kopyalandı.';
      } catch (error) {
        if (fallbackCopy(value)) {
          status.textContent = label + ' kopyalandı.';
          return;
        }
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(field);
        if (selection) {
          selection.removeAllRanges();
          selection.addRange(range);
        }
        status.textContent = label + ' seçildi. Basılı tutarak veya kopyalama menüsünden kopyalayabilirsiniz.';
      } finally {
        button.disabled = false;
      }
    });
  });
})();
