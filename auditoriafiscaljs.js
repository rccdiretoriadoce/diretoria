(function(){
    const PERIODO_ANT = 'Jan/Fev/Mar 2026';
    const PERIODO_AT  = 'Abr/Mai/Jun/Jul 2026';

    const COR_COMP = { efe:'#4bb8cc', ins:'#4169E1', prof:'#9370DB', sup:'#3ecb7b', tre:'#FF6B6B' };

    const DADOS_ANT = {
       efe:  { respostas:26, satisfacao:9.66, gestao:9.63, confianca:60.47,
              eixos:[9.69,9.81,9.62,9.85,8.38,9.62,9.73,9.96] },
      ins:  { respostas:30, satisfacao:8.89, gestao:8.43, confianca:59.41,
              eixos:[9.27,9.60,9.10,9.03,6.50,9.17,8.83,8.20] },
      prof: { respostas:40, satisfacao:9.18, gestao:8.47, confianca:94.34,
              eixos:[9.18,9.55,8.93,8.85,8.20,9.30,9.08,8.95] },
      sup:  { respostas:26, satisfacao:9.41, gestao:9.16, confianca:39.69,
              eixos:[9.27,9.77,9.15,9.15,9.15,9.58,9.35,9.08] },
      tre:  { respostas:25, satisfacao:9.36, gestao:9.41, confianca:45.54,
              eixos:[9.44,9.36,9.32,9.40,8.56,8.84,8.88,9.00] },
    };

    const DADOS_AT = {
           efe:  { respostas:32, satisfacao:9.30, gestao:9.28, confianca:84.30,
              eixos:[9.47,9.47,9.63,9.00,8.09,9.09,8.97,9.16] },
      ins:  { respostas:41, satisfacao:9.06, gestao:7.80, confianca:75.33,
              eixos:[8.95,9.15,9.34,9.37,7.37,9.00,8.73,8.17] },
      prof: { respostas:28, satisfacao:9.58, gestao:9.13, confianca:75.41,
              eixos:[9.68,9.79,9.61,9.61,8.64,9.21,9.39,9.11] },
      sup:  { respostas:35, satisfacao:9.52, gestao:9.69, confianca:52.96,
              eixos:[9.40,9.74,9.69,9.54,7.97,9.60,9.43,9.17] },
      tre:  { respostas:24, satisfacao:8.84, gestao:8.89, confianca:43.16,
              eixos:[9.17,8.96,9.17,9.00,8.08,8.63,8.21,8.63] },
    };

    const EIXOS_NOMES = ['Companheirismo','Organização','Como se sente','Motivação','Sobrecarga','Transparência','Fluxo de Ideias','Amizades'];
    const CIAS = ['sup','efe','prof','tre','ins'];
    const CIAS_NOMES = { efe:'EFE', ins:'INS', prof:'PROF', sup:'SUP', tre:'TRE' };

    let metricaAtiva = 'respostas';

    window.mostrarGrafico = function(metrica) {
      metricaAtiva = metrica;
      document.querySelectorAll('.comp-tab').forEach(b => b.classList.remove('comp-tab-ativo'));
      document.getElementById('tab-' + metrica).classList.add('comp-tab-ativo');
      renderGrafico();
    };

    function renderGrafico() {
      const cont = document.getElementById('grafico-comp');
      const maxVal = metricaAtiva === 'respostas' ? 45 : 10;
      const label = { respostas:'Respostas', satisfacao:'Satisfação /10', gestao:'Gestão /10' };
      let html = `<div style="font-family:'Nunito',sans-serif;font-size:.62rem;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:var(--texto3);margin-bottom:14px;">${label[metricaAtiva]}</div>`;

      CIAS.forEach(cia => {
        const ant = DADOS_ANT[cia][metricaAtiva];
        const at  = DADOS_AT[cia][metricaAtiva];
        const pctAnt = (ant / maxVal * 100).toFixed(1);
        const pctAt  = (at  / maxVal * 100).toFixed(1);
        const delta  = (at - ant);
        const deltaStr = (delta >= 0 ? '+' : '') + delta.toFixed(2);
        const deltaCls = delta > 0 ? 'delta-up' : delta < 0 ? 'delta-down' : 'delta-eq';
        const cor = COR_COMP[cia];

        html += `
          <div class="comp-bar-row">
            <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:4px;">
              <div class="comp-bar-label">${CIAS_NOMES[cia]}</div>
              <span class="comp-eixos-table td delta ${deltaCls}" style="font-family:'Bebas Neue',sans-serif;font-size:.95rem;letter-spacing:1px;">${deltaStr}</span>
            </div>
            <div class="comp-bar-pair">
              <div class="comp-bar-line">
                <span class="comp-period-tag">${PERIODO_ANT}</span>
                <div class="comp-bar-wrap"><div class="comp-bar-fill" style="width:${pctAnt}%;background:#05060f;"></div></div>
                <span class="comp-bar-val">${metricaAtiva==='respostas'?ant:ant.toFixed(2)}</span>
              </div>
              <div class="comp-bar-line">
                <span class="comp-period-tag">${PERIODO_AT}</span>
                <div class="comp-bar-wrap"><div class="comp-bar-fill" style="width:${pctAt}%;background:${cor};border:1.5px solid #05060f;box-sizing:border-box;"></div></div>
                <span class="comp-bar-val">${metricaAtiva==='respostas'?at:at.toFixed(2)}</span>
              </div>
            </div>
          </div>`;
      });

      cont.innerHTML = html;
    }

    function renderCompCia(cia) {
      const ant = DADOS_ANT[cia];
      const at  = DADOS_AT[cia];
      const cor = COR_COMP[cia];

      const metricas = [
        { label:'Respostas', ant: ant.respostas, at: at.respostas, sufixo:'' },
        { label:'Satisfação', ant: ant.satisfacao, at: at.satisfacao, sufixo:'/10' },
        { label:'Gestão', ant: ant.gestao, at: at.gestao, sufixo:'/10' },
      ];

      let html = `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:18px;">`;
      metricas.forEach(m => {
        const delta = (m.at - m.ant);
        const deltaStr = (delta >= 0 ? '+' : '') + delta.toFixed(m.sufixo ? 2 : 0);
        const bg = delta > 0 ? '#e8f9f0' : delta < 0 ? '#fdecea' : '#f5f5f5';
        const dc = delta > 0 ? '#2a9d5c' : delta < 0 ? '#e74c3c' : '#888';
        html += `
          <div style="background:var(--superficie);border:2.5px solid var(--borda);border-radius:var(--r);box-shadow:var(--shadow-sm);padding:14px 12px;text-align:center;">
            <div style="font-family:'Nunito',sans-serif;font-size:.55rem;font-weight:900;letter-spacing:2px;text-transform:uppercase;color:var(--texto3);margin-bottom:4px;">${m.label}</div>
            <div style="font-family:'Bebas Neue',sans-serif;font-size:1.7rem;letter-spacing:2px;color:${cor};line-height:1;">${typeof m.at==='number'&&m.sufixo?m.at.toFixed(2):m.at}<span style="font-size:.8rem;opacity:.5;">${m.sufixo}</span></div>
            <div style="font-size:.6rem;color:${dc};font-weight:900;margin-top:4px;background:${bg};border-radius:4px;padding:2px 6px;display:inline-block;">${deltaStr}</div>
          </div>`;
      });
      html += `</div>`;

      const confAnt = ant.confianca ? ant.confianca.toFixed(2) + '%' : '—';
      const confAt  = at.confianca ? at.confianca.toFixed(2) + '%' : '—';
      html += `
        <div style="
          background:#fff9e0;border:2px solid var(--borda);border-left:4px solid var(--destaque);
          border-radius:var(--rs);padding:10px 14px;font-size:.75rem;color:var(--texto2);
          line-height:1.65;margin-bottom:18px;
        ">
          <strong style="color:var(--texto);">Índice de Confiança:</strong>
          &nbsp; ${PERIODO_ANT}: <strong>${confAnt}</strong>
          &nbsp;→&nbsp;
          ${PERIODO_AT}: <strong>${confAt}</strong>
          ${cia!=='sup'&&ant.confianca?'&nbsp;<span style="font-size:.65rem;color:var(--texto3);"></span>':''}
        </div>`;

      html += `
        <table class="comp-eixos-table">
          <thead>
            <tr>
              <th>Eixo</th>
              <th style="text-align:center;">${PERIODO_ANT}</th>
              <th style="text-align:center;">${PERIODO_AT}</th>
              <th style="text-align:center;">Δ</th>
            </tr>
          </thead>
          <tbody>`;

      EIXOS_NOMES.forEach((nome, i) => {
        const va = ant.eixos[i];
        const vb = at.eixos[i];
        const d  = (vb - va);
        const ds = (d >= 0 ? '+' : '') + d.toFixed(2);
        const dc = d > 0 ? 'delta-up' : d < 0 ? 'delta-down' : 'delta-eq';
        html += `
            <tr>
              <td>${nome}</td>
              <td class="val">${va.toFixed(2)}</td>
              <td class="val" style="color:${cor};">${vb.toFixed(2)}</td>
              <td class="delta ${dc}">${ds}</td>
            </tr>`;
      });

      html += `</tbody></table>`;

      document.getElementById('comp-' + cia).innerHTML = html;
    }

    CIAS.forEach(renderCompCia);
    renderGrafico();

    setTimeout(() => {
      document.querySelectorAll('#grafico-comp .comp-bar-fill').forEach(b => {
        const w = b.style.width; b.style.width='0'; setTimeout(()=>b.style.width=w,50);
      });
    }, 100);
  })();