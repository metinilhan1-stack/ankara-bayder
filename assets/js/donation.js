/* Copy each account detail independently; leave text selectable without clipboard access. */
(function () {
  var status = document.getElementById('donation-status');
  if (!status) return;
  document.querySelectorAll('[data-copy-target]').forEach(function (button) {
    var field = document.getElementById(button.dataset.copyTarget);
    if (!field) return;
    button.hidden = false;
    button.addEventListener('click', async function () {
      var label = button.dataset.copyLabel;
      var value = field.textContent.trim();
      if (field.id === 'donation-iban') value = value.replace(/\s/g, '');
      try {
        await navigator.clipboard.writeText(value);
        status.textContent = label + ' kopyalandı.';
      } catch (error) {
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(field);
        selection.removeAllRanges();
        selection.addRange(range);
        status.textContent = label + ' seçildi. Basılı tutarak veya kopyalama menüsünden kopyalayabilirsiniz.';
      }
    });
  });
})();
