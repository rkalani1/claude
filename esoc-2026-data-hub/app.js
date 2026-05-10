(function(){
  const $ = sel => document.querySelector(sel);
  const $$ = sel => document.querySelectorAll(sel);
  const escape = s => (s===null||s===undefined?'':String(s)).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
  const naClass = v => /^n\/a/i.test(v||'') ? 'text-[color:var(--muted)]' : '';
  const impactClass = c => ({
    'practice-changing':'chip-pc',
    'near-practice-changing':'chip-near',
    'hypothesis-generating':'chip-hyp',
    'neutral-negative':'chip-neg',
    'source-limited':'chip-src'
  })[c] || '';
  const confClass = c => ({high:'chip-conf-h',moderate:'chip-conf-m',low:'chip-conf-l'})[c] || '';

  fetch('./esoc_data.json').then(r=>r.json()).then(render).catch(e=>{
    document.body.innerHTML = '<div style="color:#ff7a8a;padding:30px;font-family:monospace">esoc_data.json fetch error: '+escape(e.message)+'</div>';
  });

  function render(data){
    window.__data = data;
    renderCounters(data);
    renderFilters(data);
    renderCards(data.studies);
    renderSkipped(data.skipped_non_appraisal_or_insufficient_source_items);
    renderSources(data.source_manifest);
    renderAudit(data.coverage_audit);
    bindFilters(data);
  }

  function renderCounters(d){
    const studies = d.studies || [];
    const lbCount = studies.filter(s=>s.presentation_category && s.presentation_category.includes('late_breaking')).length;
    const lcCount = studies.filter(s=>s.presentation_category === 'included_large_clinical_trial' || s.presentation_category === 'included_high_impact_observational').length;
    const slCount = studies.filter(s=>s.practice_impact_category==='source-limited').length;
    const items = [
      ['Candidate records', d.coverage_audit?.candidate_records_reviewed?.split(/[\s.]/)[0] || '—'],
      ['Included studies', studies.length],
      ['Skipped', (d.skipped_non_appraisal_or_insufficient_source_items||[]).length],
      ['Late-breaking trials', lbCount],
      ['Large clinical / observational', lcCount],
      ['Source-limited', slCount],
      ['Sources cited', (d.source_manifest||[]).length]
    ];
    $('#counters').innerHTML = items.map(([k,v])=>`
      <div class="card p-3">
        <div class="text-[11px] uppercase tracking-wider text-[color:var(--muted)]">${escape(k)}</div>
        <div class="mono text-2xl mt-1">${escape(v)}</div>
      </div>`).join('');
  }

  function renderFilters(d){
    const subs = [...new Set(d.studies.map(s=>s.stroke_subtype).filter(Boolean))].sort();
    const doms = [...new Set(d.studies.map(s=>s.intervention_domain).filter(Boolean))].sort();
    const cats = [...new Set(d.studies.map(s=>s.presentation_category).filter(Boolean))].sort();
    $('#f-subtype').innerHTML = '<option value="">All subtypes</option>'+subs.map(s=>`<option>${escape(s)}</option>`).join('');
    $('#f-domain').innerHTML = '<option value="">All interventions</option>'+doms.map(s=>`<option>${escape(s)}</option>`).join('');
    $('#f-presentation').innerHTML = '<option value="">All presentation categories</option>'+cats.map(s=>`<option>${escape(s)}</option>`).join('');
  }

  function bindFilters(d){
    const apply = ()=> {
      const q = ($('#search').value||'').toLowerCase().trim();
      const fs = $('#f-subtype').value;
      const fd = $('#f-domain').value;
      const fi = $('#f-impact').value;
      const fc = $('#f-conf').value;
      const fp = $('#f-presentation').value;
      const filtered = d.studies.filter(s => {
        if(fs && s.stroke_subtype !== fs) return false;
        if(fd && s.intervention_domain !== fd) return false;
        if(fi && s.practice_impact_category !== fi) return false;
        if(fc && (s.confidence?.overall||'') !== fc) return false;
        if(fp && s.presentation_category !== fp) return false;
        if(!q) return true;
        const blob = JSON.stringify(s).toLowerCase();
        return blob.includes(q);
      });
      renderCards(filtered);
    };
    $$('#f-subtype,#f-domain,#f-impact,#f-conf,#f-presentation').forEach(el=>el.addEventListener('change',apply));
    $('#search').addEventListener('input',apply);
    $('#reset').addEventListener('click',()=>{$('#search').value='';$$('#f-subtype,#f-domain,#f-impact,#f-conf,#f-presentation').forEach(el=>el.value='');apply();});
  }

  function renderCards(studies){
    $('#study-count').textContent = `${studies.length} record${studies.length===1?'':'s'}`;
    if(studies.length===0){ $('#cards').innerHTML='<div class="card p-6 text-[color:var(--muted)]">No studies match the current filters.</div>'; return; }
    $('#cards').innerHTML = studies.map(card).join('');
  }

  function metricRow(label, value){
    if(value===undefined||value===null||value==='') value='N/A';
    return `<tr><td>${escape(label)}</td><td class="mono ${naClass(value)}">${escape(value)}</td></tr>`;
  }

  function card(s){
    const pe = s.results?.primary_endpoint || {};
    const pm = s.results?.primary_metrics || {};
    const cp = s.concurrent_publication || {};
    const tr = s.trial_registration || {};
    const sources = (s.source_ids||[]).map(id=>`<span class="chip mono">${escape(id)}</span>`).join(' ');
    const links = [];
    if(cp.url && cp.url !== 'N/A') links.push(`<a href="${escape(cp.url)}" target="_blank" rel="noopener">${escape(cp.journal||'Concurrent publication')} ↗</a>`);
    if(cp.doi && cp.doi !== 'N/A') links.push(`<a href="https://doi.org/${escape(cp.doi)}" target="_blank" rel="noopener" class="mono">DOI: ${escape(cp.doi)} ↗</a>`);
    if(tr.url && tr.url !== 'N/A') links.push(`<a href="${escape(tr.url)}" target="_blank" rel="noopener" class="mono">${escape(tr.identifier||tr.registry||'Registry')} ↗</a>`);
    return `
    <details class="card p-0">
      <summary class="p-4 flex flex-col gap-2">
        <div class="flex items-start gap-3 flex-wrap">
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 flex-wrap mb-1">
              <span class="chip mono">${escape(s.abstract_number||'no abstract #')}</span>
              <span class="chip ${impactClass(s.practice_impact_category)}">${escape(s.practice_impact_category||'unclassified')}</span>
              <span class="chip ${confClass(s.confidence?.overall)}">conf: ${escape(s.confidence?.overall||'unknown')}</span>
            </div>
            <div class="font-semibold leading-snug">${escape(s.study_acronym||'(no acronym)')}</div>
            <div class="text-[12.5px] text-[color:var(--muted)] mt-1">${escape(s.full_title||'')}</div>
          </div>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-2 text-[13px]">
          <div><span class="text-[color:var(--muted)]">Subtype:</span> ${escape(s.stroke_subtype||'—')}</div>
          <div><span class="text-[color:var(--muted)]">Intervention:</span> ${escape(s.intervention_domain||'—')}</div>
          <div><span class="text-[color:var(--muted)]">Primary endpoint:</span> ${escape(pe.definition||'—')}</div>
          <div class="mono"><span class="text-[color:var(--muted)] font-sans">Effect / p:</span> ${escape(pm.relative_effect_size||pm.p_value||'N/A')}</div>
        </div>
      </summary>
      <div class="px-4 pb-4 divider pt-3">
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Methodology</div>
            <table class="metric-table">
              ${metricRow('Design',s.methodology?.design)}
              ${metricRow('Phase',s.methodology?.phase)}
              ${metricRow('Randomization',s.methodology?.randomization)}
              ${metricRow('Blinding',s.methodology?.blinding)}
              ${metricRow('Centres / countries',s.methodology?.centers_countries)}
              ${metricRow('Analysis population',s.methodology?.analysis_population)}
              ${metricRow('Planned n',s.methodology?.powering?.planned_n)}
              ${metricRow('Analysed n',s.methodology?.powering?.analyzed_n)}
            </table>
          </div>
          <div>
            <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Population & imaging</div>
            <table class="metric-table">
              ${metricRow('Inclusion',s.population?.inclusion_criteria)}
              ${metricRow('Time window',s.population?.time_window)}
              ${metricRow('Baseline NIHSS',s.population?.nihss)}
              ${metricRow('Imaging modality',s.population?.imaging_parameters?.imaging_modality)}
              ${metricRow('ASPECTS / core',s.population?.imaging_parameters?.aspects_threshold || s.population?.imaging_parameters?.core_volume_limit)}
              ${metricRow('Occlusion location',s.population?.imaging_parameters?.occlusion_location)}
            </table>
          </div>
          <div>
            <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Arms</div>
            <table class="metric-table">
              ${metricRow('Intervention',s.arms?.intervention)}
              ${metricRow('Control',s.arms?.control)}
              ${metricRow('Co-interventions',s.arms?.cointerventions)}
              ${metricRow('Crossover/rescue',s.arms?.crossover_or_rescue_therapy)}
            </table>
          </div>
          <div>
            <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Primary results</div>
            <table class="metric-table">
              ${metricRow('Endpoint',pe.definition)}
              ${metricRow('Timepoint',pe.timepoint)}
              ${metricRow('Raw events',pm.raw_events)}
              ${metricRow('Rate / values',pm.rate)}
              ${metricRow('Effect estimate',pm.relative_effect_size)}
              ${metricRow('OR / HR / RR',pm.odds_ratio || pm.hazard_ratio || pm.risk_ratio)}
              ${metricRow('95% CI',pm.ci_95)}
              ${metricRow('p-value',pm.p_value)}
              ${metricRow('Analysis model',pm.analysis_model)}
            </table>
          </div>
          <div>
            <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Safety</div>
            <table class="metric-table">
              ${metricRow('sICH rate',s.safety?.sICH?.rate)}
              ${metricRow('sICH criteria',s.safety?.sICH?.criteria)}
              ${metricRow('Mortality 90d',s.safety?.mortality_90d?.rate)}
              ${metricRow('Serious AEs',s.safety?.serious_adverse_events)}
              ${metricRow('Other safety signals',s.safety?.other_safety_signals)}
            </table>
          </div>
          <div>
            <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Secondary metrics</div>
            <div class="text-[13px]">${(s.results?.secondary_metrics||[]).map(m=>`<div class="mb-1"><span class="text-[color:var(--muted)]">${escape(m.endpoint)}:</span> <span class="mono">${escape(m.result)}</span></div>`).join('') || '<span class="text-[color:var(--muted)]">— none reported in press surface</span>'}</div>
          </div>
        </div>
        <div class="mt-4">
          <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Critical appraisal</div>
          <div class="card2 p-3 text-[13.5px] leading-6">${escape(s.critical_appraisal?.bottom_line_for_vascular_neurologist||'—')}</div>
          <details class="mt-2">
            <summary class="text-[12.5px] text-[color:var(--accent)] cursor-pointer">Show full structured appraisal ↓</summary>
            <table class="metric-table mt-2">
              ${metricRow('PICO / question',s.critical_appraisal?.pico_and_clinical_question)}
              ${metricRow('Design / internal validity',s.critical_appraisal?.design_and_internal_validity)}
              ${metricRow('Population / imaging gate / external validity',s.critical_appraisal?.population_imaging_gate_and_external_validity)}
              ${metricRow('Treatment contrast / contamination',s.critical_appraisal?.treatment_contrast_and_contamination)}
              ${metricRow('Endpoint validity',s.critical_appraisal?.endpoint_validity_and_interpretability)}
              ${metricRow('Statistical validity',s.critical_appraisal?.statistical_validity)}
              ${metricRow('Selection bias',s.critical_appraisal?.bias_threats?.selection_bias)}
              ${metricRow('Performance bias',s.critical_appraisal?.bias_threats?.performance_bias)}
              ${metricRow('Detection bias',s.critical_appraisal?.bias_threats?.detection_bias)}
              ${metricRow('Attrition / differential follow-up',s.critical_appraisal?.bias_threats?.attrition_or_differential_followup)}
              ${metricRow('Crossover / protocol violations',s.critical_appraisal?.bias_threats?.crossover_protocol_violations)}
              ${metricRow('Missing data handling',s.critical_appraisal?.missing_data_handling)}
              ${metricRow('Safety signal interpretation',s.critical_appraisal?.safety_signal_interpretation)}
              ${metricRow('Practice impact',s.critical_appraisal?.practice_impact)}
              ${metricRow('What I would need before changing practice',s.critical_appraisal?.what_i_would_need_before_changing_practice)}
            </table>
          </details>
        </div>
        <div class="mt-4">
          <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Missing fields</div>
          <ul class="text-[13px] list-disc pl-5">
            ${(s.missing_fields||[]).map(m=>`<li><span class="mono">${escape(m.field)}</span> — <span class="text-[color:var(--muted)]">${escape(m.missing_reason)}</span></li>`).join('') || '<li class="text-[color:var(--muted)]">none flagged</li>'}
          </ul>
        </div>
        <div class="mt-4 flex flex-wrap items-center gap-2">
          <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mr-2">Sources</div>
          ${sources}
          ${links.length ? '<span class="ml-2"></span>' + links.join(' &nbsp; ') : ''}
        </div>
      </div>
    </details>`;
  }

  function renderSkipped(rows){
    $('#skip-count').textContent = `${rows.length} entries`;
    const tbody = $('#skip-table tbody');
    tbody.innerHTML = rows.map(r=>`
      <tr>
        <td class="mono">${escape(r.candidate_id)}</td>
        <td>${escape(r.abstract_number)}</td>
        <td>${escape(r.title)}</td>
        <td><span class="chip">${escape(r.skip_category)}</span></td>
        <td class="text-[color:var(--muted)]">${escape(r.reason)}</td>
      </tr>`).join('');
  }

  function renderSources(rows){
    $('#src-count').textContent = `${rows.length} sources`;
    const tbody = $('#src-table tbody');
    tbody.innerHTML = rows.map(r=>{
      const url = r.url && r.url !== 'N/A' ? `<a href="${escape(r.url)}" target="_blank" rel="noopener">${escape(r.title)} ↗</a>` : escape(r.title);
      return `<tr>
        <td class="mono">${escape(r.source_id)}</td>
        <td>${escape((r.source_type||'').replace(/_/g,' '))}</td>
        <td>${url}${r.doi && r.doi !== 'N/A' ? `<div class="mono text-[12px] text-[color:var(--muted)]">DOI ${escape(r.doi)}</div>` : ''}</td>
        <td class="text-[color:var(--muted)]">${escape(r.limitations)}</td>
      </tr>`;
    }).join('');
  }

  function renderAudit(a){
    if(!a){return}
    const lim = (a.known_access_limitations||[]).map(l=>`<li class="mb-1">${escape(l)}</li>`).join('');
    const trav = (a.master_sources_traversed||[]).map(l=>`<li class="mono text-[12.5px] mb-1">${escape(l)}</li>`).join('');
    $('#audit-body').innerHTML = `
      <table class="metric-table">
        ${metricRow('Candidate records reviewed',a.candidate_records_reviewed)}
        ${metricRow('Included',a.included)}
        ${metricRow('Skipped',a.skipped)}
        ${metricRow('Duplicates',a.duplicates)}
        ${metricRow('Coverage equation',a.coverage_equation)}
        ${metricRow('Coverage equation verified',a.coverage_equation_verified)}
      </table>
      <div class="grid md:grid-cols-2 gap-5 mt-4">
        <div>
          <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Known access limitations</div>
          <ul class="text-[13px] list-disc pl-5">${lim}</ul>
        </div>
        <div>
          <div class="text-[color:var(--muted)] uppercase tracking-wider text-[11px] mb-1">Master sources traversed</div>
          <ul class="list-disc pl-5">${trav}</ul>
        </div>
      </div>`;
  }
})();
