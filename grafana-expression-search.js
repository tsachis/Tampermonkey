// ==UserScript==
// @name         Grafana expression search
// @namespace    http://tampermonkey.net/
// @version      2024-03-17
// @description  Find expression usages in grafana panels
// @author       Tsachi Shushan
// @match        https://grafana.*.com/d*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=grafana.com
// @grant GM_addElement
// @grant GM_addStyle
// @grant unsafeWindow
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
    #searchDialog {
    width: 500px;
    }

    #searchInput {
    width: 400px;
    }


    #openDialog {
    position: absolute;
    z-index: 100000;
    left: 7px;
    top: 50%;
    width: 30px;
    height: 30px;
    border: 0;
    background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="30" height="30" viewBox="0 0 32 32"><linearGradient id="lQZZOoyhzclkgqEvRJgJga_hxnYctXJKaKb_gr1" x1="22.49" x2="24.823" y1="24.809" y2="22.476" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="%23b5b6bf"></stop><stop offset=".503" stop-color="%23e3e3e3"></stop><stop offset="1" stop-color="%23b5b6bf"></stop></linearGradient><path fill="url(%23lQZZOoyhzclkgqEvRJgJga_hxnYctXJKaKb_gr1)" d="M18.938,21.204l6.688,6.688c0.626,0.626,2.891-1.64,2.265-2.265l-6.688-6.688L18.938,21.204z"></path><linearGradient id="lQZZOoyhzclkgqEvRJgJgb_hxnYctXJKaKb_gr2" x1="20.071" x2="27.228" y1="20.071" y2="27.228" gradientUnits="userSpaceOnUse"><stop offset="0" stop-opacity=".02"></stop><stop offset="1" stop-opacity=".15"></stop></linearGradient><path fill="url(%23lQZZOoyhzclkgqEvRJgJgb_hxnYctXJKaKb_gr2)" d="M21.204,19.292l6.511,6.511 c0.055,0.055,0.044,0.195-0.03,0.373c-0.28,0.677-1.291,1.574-1.773,1.574c-0.075,0-0.1-0.025-0.11-0.035l-6.511-6.511 L21.204,19.292 M21.204,18.938l-2.265,2.265l6.688,6.688C25.701,27.967,25.799,28,25.913,28c0.839,0,2.53-1.823,1.979-2.374 L21.204,18.938L21.204,18.938z"></path><linearGradient id="lQZZOoyhzclkgqEvRJgJgc_hxnYctXJKaKb_gr3" x1="14" x2="14" y1="3.913" y2="24.009" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="%23e1e2ed"></stop><stop offset="1" stop-color="%23c6c7d1"></stop></linearGradient><circle cx="14" cy="14" r="10" fill="url(%23lQZZOoyhzclkgqEvRJgJgc_hxnYctXJKaKb_gr3)"></circle><linearGradient id="lQZZOoyhzclkgqEvRJgJgd_hxnYctXJKaKb_gr4" x1="14" x2="14" y1="4" y2="24" gradientUnits="userSpaceOnUse"><stop offset="0" stop-opacity=".02"></stop><stop offset="1" stop-opacity=".15"></stop></linearGradient><path fill="url(%23lQZZOoyhzclkgqEvRJgJgd_hxnYctXJKaKb_gr4)" d="M14,4.25c5.376,0,9.75,4.374,9.75,9.75 s-4.374,9.75-9.75,9.75S4.25,19.376,4.25,14S8.624,4.25,14,4.25 M14,4C8.477,4,4,8.477,4,14s4.477,10,10,10s10-4.477,10-10 S19.523,4,14,4L14,4z"></path><linearGradient id="lQZZOoyhzclkgqEvRJgJge_hxnYctXJKaKb_gr5" x1="19.21" x2="8.958" y1="19.21" y2="8.958" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="%23d9f5ff"></stop><stop offset="1" stop-color="%23bfe8ff"></stop></linearGradient><circle cx="14" cy="14" r="8" fill="url(%23lQZZOoyhzclkgqEvRJgJge_hxnYctXJKaKb_gr5)"></circle><linearGradient id="lQZZOoyhzclkgqEvRJgJgf_hxnYctXJKaKb_gr6" x1="14" x2="14" y1="22" y2="6" gradientUnits="userSpaceOnUse"><stop offset="0" stop-opacity=".15"></stop><stop offset="1" stop-opacity=".15"></stop></linearGradient><path fill="url(%23lQZZOoyhzclkgqEvRJgJgf_hxnYctXJKaKb_gr6)" d="M14,6.25c4.273,0,7.75,3.477,7.75,7.75s-3.477,7.75-7.75,7.75S6.25,18.273,6.25,14S9.727,6.25,14,6.25 M14,6c-4.418,0-8,3.582-8,8s3.582,8,8,8s8-3.582,8-8S18.418,6,14,6L14,6z"></path></svg>')
    }

    .li-header {
    font-weight: bold;
    padding: 5px 0;
    }
    `);

    GM_addElement(document.body, 'dialog', {
        id: 'searchDialog'
    });

    const searchDialog = document.getElementById('searchDialog');
    searchDialog.innerHTML = `
    <h2>Search</h2>
  <input type="text" id="searchInput" placeholder="Search for expressions...">
  <button id="searchBtn">Search</button>
  <ul id="resultsList" style="list-style-type:none;"></ul>
    `
  const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const resultsList = document.getElementById('resultsList');
    GM_addElement(document.body, 'button', {
        id: 'openDialog'
    });

    const openDialog = document.getElementById('openDialog');

    openDialog.addEventListener('click', () => {
        searchDialog.showModal();
    });

    function searchPanel(panel, searchTerm, results) {
        const { panels, ...rest } = panel;
        console.log(rest, searchTerm);
        if (JSON.stringify(rest).includes(searchTerm)) {
            results.push({title: rest.title});
        }
        if (panels) {
            panels.forEach(p => searchPanel(p, searchTerm, results));
        }
    }

    function addResults(name, results) {
        if (results?.length) {
            const listItem = document.createElement('li');
            listItem.textContent = name;
            listItem.classList.add('li-header');
            resultsList.appendChild(listItem);
            results.forEach((result) => {
                const listItem = document.createElement('li');
                listItem.textContent = result.title;
                resultsList.appendChild(listItem);
            });
        }

    }

    searchBtn.addEventListener('click', () => {
        const model = unsafeWindow.grafanaRuntime.getDashboardSaveModel();
        const searchTerm = searchInput.value;
        const panelResults = [];
        resultsList.innerHTML = '';

        model.panels.forEach(p => searchPanel(p, searchTerm, panelResults));

        addResults('Panels', panelResults);

        const templateResults = model.templating?.list.filter(t => JSON.stringify(t).includes(searchTerm)).map(t => ({title: t.label || t.name}));
        addResults('Templates', templateResults);
        const annotationsResults = model.annotations?.list.filter(a => JSON.stringify(a).includes(searchTerm)).map(a => ({title: a.label || a.name}));
        addResults('Annotations', templateResults);
    });

    // Optional: an event listener to close the dialog when a click occurs outside of the dialog
    window.addEventListener('click', (event) => {
        if (event.target === searchDialog) {
            searchDialog.close();
        }
    });


})();
