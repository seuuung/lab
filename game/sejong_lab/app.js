/* 세종 개발실 - 정적 웹 앱: 예제, 편집기, 한글 해석기, 로컬 저장 */
(() => {
  'use strict';
  const $ = selector => document.querySelector(selector);
  const examples = [
    {id:'hello', title:'첫 인사', subtitle:'출력과 변수', level:'첫걸음', code:`# 세종 개발실에 오신 것을 환영합니다!\n# 아래 코드를 직접 바꿔 보세요.\n\n이름 = "세종"\n\n함수 인사하기(누구):\n    출력("안녕하세요, " + 누구 + "님!")\n\n반복 3번:\n    인사하기(이름)\n\n출력("오늘도 즐거운 코딩!")`},
    {id:'condition', title:'조건의 갈림길', subtitle:'만약 · 아니면', level:'기초', code:`# 점수를 바꾸면 결과도 달라집니다.\n점수 = 85\n\n만약 점수 >= 90:\n    출력("참 잘했어요! 🌟")\n아니고 만약 점수 >= 80:\n    출력("훌륭합니다! 👏")\n아니면:\n    출력("조금만 더 연습해 봐요.")\n\n출력("입력한 점수: " + 글자열(점수))`},
    {id:'loop', title:'차곡차곡 반복', subtitle:'반복문과 계산', level:'기초', code:`# 1부터 10까지의 합을 구해 봅시다.\n합계 = 0\n숫자 = 1\n\n반복 10번:\n    합계 += 숫자\n    숫자 += 1\n\n출력("1부터 10까지 더하면?")\n출력("정답은 " + 합계 + "입니다!")`},
    {id:'function', title:'함수 만들기', subtitle:'매개변수 · 돌려주기', level:'도전', code:`# 함수를 만들어 재사용해 보세요.\n함수 제곱(숫자):\n    돌려주기 숫자 * 숫자\n\n함수 큰수(하나, 둘):\n    만약 하나 > 둘:\n        돌려주기 하나\n    아니면:\n        돌려주기 둘\n\n출력("7의 제곱: " + 제곱(7))\n출력("더 큰 수: " + 큰수(32, 58))`},
    {id:'list', title:'아름다운 우리말', subtitle:'목록 · 각각 반복', level:'도전', code:`# 자랑스러운 우리말을 소개합니다.\n낱말들 = ["윤슬", "미리내", "여우비", "가람"]\n\n출력("아름다운 우리말 목록")\n출력("모두 " + 길이(낱말들) + "개의 낱말")\n출력("─────────────────")\n\n반복 낱말 각각 낱말들에서:\n    출력("✦ " + 낱말)\n\n출력("─────────────────")`},
    {id:'challenge', title:'세종 수수께끼', subtitle:'배수 찾기 · 도전', level:'심화', code:`# 1부터 20까지 숫자를 살펴보세요.\n# 3의 배수는 '가', 5의 배수는 '나'\n# 둘 다 해당한다면 '가나다'를 출력합니다.\n숫자 = 1\n\n반복 20번:\n    만약 숫자 % 15 == 0:\n        출력("가나다")\n    아니고 만약 숫자 % 3 == 0:\n        출력("가")\n    아니고 만약 숫자 % 5 == 0:\n        출력("나")\n    아니면:\n        출력(숫자)\n    숫자 += 1`},
    {id:'recursion', title:'함수와 재귀', subtitle:'함수 자신을 다시 호출', level:'심화', expected:'120', code:`# 5의 계승을 계산합니다.\n함수 계승(수):\n    만약 수 <= 1:\n        돌려주기 1\n    돌려주기 수 * 계승(수 - 1)\n\n출력(계승(5))`},
    {id:'dictionary', title:'목록과 사전', subtitle:'복합 자료구조 수정', level:'심화', expected:'세종 · 280', code:`학생 = {\n    "이름": "세종",\n    "점수": [90, 85, 100]\n}\n학생["점수"][0] = 95\n출력(학생["이름"])\n출력(합계(학생["점수"]))`},
    {id:'guess', title:'숫자 맞히기', subtitle:'입력과 조건', level:'도전', expected:'7을 입력하면 정답 메시지', code:`정답 = 7\n입력값 = 정수(입력("1부터 10까지 숫자를 입력하세요"))\n만약 입력값 == 정답:\n    출력("정답입니다!")\n아니면:\n    출력("다시 도전해 보세요.")`},
    {id:'multiplication', title:'구구단 만들기', subtitle:'범위와 반복', level:'기초', expected:'2단의 아홉 줄', code:`반복 수 각각 범위(1, 10):\n    출력("2 × " + 수 + " = " + (2 * 수))`},
    {id:'drawing', title:'도형 그리기', subtitle:'Canvas 그림', level:'창작', expected:'파란 바탕에 노란 원과 흰 글씨', code:`화면만들기(600, 400)\n배경색("#12354b")\n색상설정("#ffd166")\n원그리기(300, 190, 80)\n색상설정("흰색")\n글자그리기("우리말로 그리기", 220, 330)`},
    {id:'animation', title:'움직이는 공', subtitle:'매프레임 애니메이션', level:'창작', expected:'움직이는 하늘색 공', code:`화면만들기(600, 320)\n위치 = 0\n함수 그리기():\n    배경색("#122d3d")\n    색상설정("하늘색")\n    원그리기(위치, 160, 28)\n    위치 = 위치 + 2\n    만약 위치 > 600:\n        위치 = 0\n매프레임(그리기)`}
  ];
  const expectedResults={
    hello:'인사 3번과 마무리 문장',condition:'훌륭합니다! 👏',loop:'정답은 55입니다!',
    function:'7의 제곱: 49 · 더 큰 수: 58',list:'우리말 4개를 차례로 출력',challenge:'1부터 20까지 가/나/가나다 표시'
  };
  examples.forEach(item=>{item.expected ||= expectedResults[item.id];});

  let selectedId='hello', worker=null, pythonWorker=null, runTimeout=null, isRunning=false, toastTimeout=null, loadedSource='', animationFrame=null, runId=0, waitingInput=false;
  const source=$('#source'), highlight=$('#highlight'), gutter=$('#line-numbers'), consoleOutput=$('#console-output');
  const runtimeText=$('#sejong-runtime').textContent;

  function htmlEscape(s) {return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');}
  const keywords=new Set(['함수','만약','아니고','아니면','반복','각각','번','에서','인동안','동안','돌려주기','참','거짓','없음','그리고','또는','아니다','반복끝내기','다음반복','그만','계속']);
  const builtins=new Set(['출력','길이','글자열','문자열','숫자','실수','정수','절댓값','최댓값','최솟값','범위','합계','정렬','추가','삭제','무작위','입력','화면만들기','배경색','색상설정','원그리기','사각형그리기','선그리기','글자그리기','화면지우기','매프레임']);
  function renderCodeLine(line) {
    const split=line.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#.*$)/gu);
    return split.map(part=>{
      if(!part)return '';
      if(part.startsWith('#'))return '<span class="tok-comment">'+htmlEscape(part)+'</span>';
      if(part.startsWith('"')||part.startsWith("'"))return '<span class="tok-string">'+htmlEscape(part)+'</span>';
      let output='',last=0;
      const re=/([가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_][가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_0-9]*|\d+(?:\.\d+)?|==|!=|<=|>=|\/\/|[+\-*\/%=<>])/gu;
      for(const match of part.matchAll(re)){
        const word=match[0],i=match.index;
        output+=htmlEscape(part.slice(last,i));
        const cls=keywords.has(word)?'tok-keyword':builtins.has(word)?'tok-fn':/^\d/.test(word)?'tok-number':/[+\-*\/%=<>]/.test(word)?'tok-operator':null;
        output+=cls?`<span class="${cls}">${htmlEscape(word)}</span>`:htmlEscape(word);
        last=i+word.length;
      }
      return output+htmlEscape(part.slice(last));
    }).join('');
  }
  function renderEditor() {
    const text=source.value;
    const lines=text.split('\n');
    highlight.innerHTML=lines.map(renderCodeLine).join('\n')+(text.endsWith('\n')?'\u200b':'');
    gutter.textContent=lines.map((_,i)=>i+1).join('\n');
    $('#editor-lines').textContent=lines.length+'줄';
    source.scrollTop=Math.min(source.scrollTop,Math.max(0,source.scrollHeight-source.clientHeight));
    updateCursor();
    syncScroll();
  }
  function syncScroll() {highlight.scrollTop=source.scrollTop;highlight.scrollLeft=source.scrollLeft;gutter.scrollTop=source.scrollTop;}
  function updateCursor() {
    const before=source.value.slice(0,source.selectionStart).split('\n');
    $('#cursor-pos').textContent=before.length+'행, '+(before[before.length-1].length+1)+'열';
  }
  function save() {
    try {localStorage.setItem('sejong_code',source.value);localStorage.setItem('sejong_example',selectedId);} catch(_error) {}
    $('#save-hint').textContent='● 자동 저장됨';
  }
  function setSource(value,persist=true) {
    source.value=value;renderEditor();if(persist)save();
  }
  function setActiveExample(id) {
    const item=examples.find(e=>e.id===id)||examples[0];
    selectedId=item.id;
    $('#current-name').textContent=item.title+'.세종';
    $('#editor-tab-name').textContent=item.title+'.세종';
    document.querySelectorAll('.example-button').forEach(el=>{const active=el.dataset.example===id;el.classList.toggle('active',active);el.setAttribute('aria-current',active?'true':'false');});
    $('#editor-tip').innerHTML='이 예제는 <b>'+htmlEscape(item.subtitle)+'</b>을 배웁니다.'+(item.expected?' 예상 결과: '+htmlEscape(item.expected):' 내용을 자유롭게 수정해 보세요.');
  }
  function chooseExample(id) {
    const item=examples.find(e=>e.id===id);if(!item)return;
    const current=examples.find(e=>e.id===selectedId);
    if(source.value && source.value!==current?.code && !window.confirm('작성 중인 코드가 바뀝니다. 예제를 불러올까요?'))return;
    stopRun(false);setActiveExample(id);setSource(item.code);emptyConsole();setTab('output');
    toast(`‘${item.title}’ 예제를 불러왔습니다.`);
  }
  function showExamples() {
    const container=$('#example-list');
    container.innerHTML=examples.map((item,i)=>`<button type="button" class="example-button" data-example="${item.id}" aria-current="false"><span class="example-index">${String(i+1).padStart(2,'0')}</span><span><span class="example-name">${htmlEscape(item.title)}</span><span class="example-description">${htmlEscape(item.subtitle)}</span></span><span class="example-arrow">›</span></button>`).join('');
    container.addEventListener('click',event=>{const button=event.target.closest('button[data-example]');if(button)chooseExample(button.dataset.example);});
  }
  function toast(message) {
    const item=$('#toast');item.textContent=message;item.classList.add('show');
    clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>item.classList.remove('show'),2700);
  }
  function setTab(name) {
    for(const tab of ['output','graphic']){
      const selected=tab===name;
      $('#tab-'+tab).classList.toggle('selected',selected);
      $('#tab-'+tab).setAttribute('aria-selected',String(selected));
      $('#'+tab+'-panel').classList.toggle('hidden',!selected);
    }
    document.querySelector('.console-panel').dataset.mobileView=name;
    setMobileView(name);
  }
  function setMobileView(name) {
    document.querySelector('.ide-grid').dataset.mobileView=name;
    document.querySelectorAll('.mobile-view-tabs button').forEach(button=>{
      const active=button.dataset.view===name;
      button.classList.toggle('selected',active);
      button.setAttribute('aria-selected',String(active));
    });
  }
  function setStatus(status,label) {
    const el=$('#console-status');el.className='console-status '+(status||'');el.innerHTML='<span class="status-led"></span> '+htmlEscape(label);
  }
  function emptyConsole() {
    consoleOutput.innerHTML='<div class="console-empty"><span class="empty-icon">↳</span><strong>무엇을 만들어 볼까요?</strong><p>왼쪽에 한글 코드를 작성한 다음<br><b>실행하기</b>를 눌러보세요.</p></div>';
    $('#run-info').textContent='실행할 준비가 되었습니다.';setStatus('','준비됨');
  }
  function appendOutput(text,klass='') {
    const row=document.createElement('div');row.className='console-row '+klass;
    const prompt=document.createElement('span');prompt.className='console-prompt';prompt.textContent=klass==='is-error'?'!':klass==='is-system'?'·':'›';
    const value=document.createElement('span');value.className='console-text';value.textContent=text;
    row.append(prompt,value);consoleOutput.appendChild(row);consoleOutput.scrollTop=consoleOutput.scrollHeight;
  }
  function showRunning(yes) {
    isRunning=yes;$('#run-btn').classList.toggle('hidden',yes);$('#stop-btn').classList.toggle('hidden',!yes);
  }
  function stopRun(notify=true) {
    runId++;
    if(runTimeout){clearTimeout(runTimeout);runTimeout=null;}
    if(animationFrame!==null){cancelAnimationFrame(animationFrame);animationFrame=null;}
    $('#input-form').classList.add('hidden');waitingInput=false;
    if(worker){worker.terminate();worker=null;}
    if(isRunning){showRunning(false);if(notify){appendOutput('사용자가 실행을 중단했습니다.','is-system');$('#run-info').textContent='실행 중단';setStatus('','중단됨');}}
  }
  function newWorker() {
    const url=URL.createObjectURL(new Blob([runtimeText],{type:'text/javascript'}));
    try { return new Worker(url); }
    finally { setTimeout(()=>URL.revokeObjectURL(url),1000); }
  }
  function armTimeout(id) {
    clearTimeout(runTimeout);
    runTimeout=setTimeout(()=>{
      if(!isRunning||id!==runId)return;
      stopRun(false);appendOutput('실행 시간이 3초를 넘었습니다. 무한 반복이 없는지 확인해 주세요.','is-error');
      $('#run-info').textContent='시간 제한 초과';setStatus('error','실행 중단');
    },3000);
  }
  const graphicColors={검정:'#000000',흰색:'#ffffff',빨강:'#ef4444',파랑:'#3b82f6',초록:'#22c55e',노랑:'#facc15',하늘색:'#7dd3fc',보라:'#a78bfa'};
  let paintColor='#d8f5e9', graphicStarted=false;
  function graphicCommand(command,args) {
    const canvas=$('#graphic-canvas'),context=canvas.getContext('2d');
    if(command==='화면만들기') {
      canvas.width=args[0];canvas.height=args[1];paintColor='#d8f5e9';graphicStarted=true;setTab('graphic');return;
    }
    if(!graphicStarted){graphicStarted=true;setTab('graphic');}
    if(command==='배경색'){context.fillStyle=graphicColors[args[0]]||args[0];context.fillRect(0,0,canvas.width,canvas.height);return;}
    if(command==='화면지우기'){context.clearRect(0,0,canvas.width,canvas.height);return;}
    if(command==='색상설정'){paintColor=graphicColors[args[0]]||args[0];return;}
    context.fillStyle=paintColor;context.strokeStyle=paintColor;context.lineWidth=2;
    if(command==='원그리기'){context.beginPath();context.arc(args[0],args[1],Math.max(0,args[2]),0,Math.PI*2);context.fill();}
    if(command==='사각형그리기')context.fillRect(...args);
    if(command==='선그리기'){context.beginPath();context.moveTo(args[0],args[1]);context.lineTo(args[2],args[3]);context.stroke();}
    if(command==='글자그리기'){context.font='20px sans-serif';context.fillText(...args);}
  }
  function run() {
    stopRun(false);const id=runId;setTab('output');consoleOutput.textContent='';showRunning(true);
    graphicStarted=false;$('#graphic-canvas').getContext('2d').clearRect(0,0,$('#graphic-canvas').width,$('#graphic-canvas').height);
    setStatus('running','실행 중');$('#run-info').textContent='한글 명령어를 해석하고 있습니다...';
    try {worker=newWorker();}
    catch(e){showRunning(false);setStatus('error','시작 실패');appendOutput('이 브라우저에서는 실행기를 시작할 수 없습니다.','is-error');return;}
    worker.onmessage=event=>{
      if(id!==runId)return;
      const data=event.data;
      if(data.type==='output'){appendOutput(data.text);return;}
      if(data.type==='graphic'){try{graphicCommand(data.command,data.args);}catch(_error){appendOutput('그래픽 명령을 그릴 수 없습니다. 좌표와 색상을 확인하세요.','is-error');}return;}
      if(data.type==='input-request'){
        clearTimeout(runTimeout);runTimeout=null;waitingInput=true;setTab('output');
        $('#input-label').textContent=data.prompt||'값을 입력하세요';
        $('#input-value').value='';$('#input-form').classList.remove('hidden');$('#input-value').focus();
        $('#run-info').textContent='입력을 기다리는 중';setStatus('running','입력 대기');return;
      }
      if(data.type==='animation-start'){
        clearTimeout(runTimeout);runTimeout=null;
        $('#run-info').textContent='애니메이션 실행 중 · 중단 버튼으로 종료';setStatus('running','그리는 중');setTab('graphic');return;
      }
      if(data.type==='frame-ready'){
        animationFrame=requestAnimationFrame(()=>{
          animationFrame=null;if(id===runId&&worker)worker.postMessage({type:'frame'});
        });return;
      }
      if(data.type==='error'){
        const position=data.line?`${data.line}번째 줄 · `:'';
        setTab('output');appendOutput(position+(data.kind||'실행 오류')+': '+data.message,'is-error');
        $('#run-info').textContent=data.line?`${data.line}번째 줄에서 오류 발생`:'실행 중 오류 발생';
        setStatus('error','오류 발생');stopRun(false);
        if(data.line)highlightErrorLine(data.line);
        return;
      }
      if(data.type==='done'){
        const meta=document.createElement('div');meta.className='console-success';
        meta.textContent=`✓ 정상 종료 · ${data.duration}ms · ${data.outputs}개 출력 · ${data.steps.toLocaleString()}단계`;
        consoleOutput.appendChild(meta);
        $('#run-info').textContent=`실행 완료 · ${data.duration}ms`;
        setStatus('','실행 완료');stopRun(false);
      }
    };
    worker.onerror=()=>{if(id!==runId)return;appendOutput('실행기 오류가 발생했습니다. 페이지를 새로고침해 주세요.','is-error');setStatus('error','실행 오류');stopRun(false);};
    armTimeout(id);
    worker.postMessage({type:'run',source:source.value});
  }
  function highlightErrorLine(line) {
    const lines=source.value.split('\n');if(line>lines.length)return;
    const start=lines.slice(0,line-1).reduce((a,s)=>a+s.length+1,0);
    source.focus();source.setSelectionRange(start,start+lines[line-1].length);updateCursor();
    setMobileView('code');
  }
  function formatCode() {
    const before=source.value;
    const after=before.split('\n').map(line=>line.replace(/\t/g,'    ').replace(/[ \t]+$/,'')).join('\n');
    if(after===before){toast('정리할 공백이 없습니다.');return;}
    setSource(after);toast('탭과 줄 끝 공백을 정리했습니다.');
  }
  const completions={출력:'값을 결과 창에 표시',입력:'실행 중 값을 받기',범위:'반복할 숫자 목록 만들기',길이:'문자열·목록·사전의 길이',합계:'숫자 목록 합하기',정렬:'목록 정렬',추가:'목록에 값 추가',삭제:'목록·사전에서 값 삭제',화면만들기:'그림판 크기 설정',배경색:'그림판 배경 채우기',원그리기:'원을 채워 그리기',사각형그리기:'사각형을 채워 그리기',선그리기:'선 그리기',글자그리기:'글자 그리기',매프레임:'함수를 프레임마다 호출',함수:'함수 선언',만약:'조건 분기',동안:'조건 반복',반복:'횟수·목록 반복',돌려주기:'함수의 값 반환'};
  let completionWord='';
  function hideCompletion(){completionWord='';$('#completion').classList.add('hidden');}
  function updateCompletion(){
    const before=source.value.slice(0,source.selectionStart);
    const match=before.match(/[가-힣]{1,}$/u);
    if(!match||source.selectionStart!==source.selectionEnd){hideCompletion();return;}
    const word=match[0],choices=Object.entries(completions).filter(([name])=>name.startsWith(word)&&name!==word).slice(0,5);
    if(!choices.length){hideCompletion();return;}
    completionWord=word;
    $('#completion').innerHTML=choices.map(([name,description])=>`<button type="button" role="option" data-completion="${name}"><b>${name}</b><span>${description}</span></button>`).join('');
    $('#completion').classList.remove('hidden');
  }
  function acceptCompletion(name) {
    if(!completionWord)return;
    const end=source.selectionStart,start=end-completionWord.length;
    source.setRangeText(name,start,end,'end');hideCompletion();renderEditor();save();source.focus();
  }
  function togglePython(show) {
    $('#python-panel').classList.toggle('hidden',!show);
    document.querySelector('.ide-grid').classList.toggle('python-open',show);
    $('#python-btn').setAttribute('aria-expanded',String(show));
    if(!show){if(pythonWorker){pythonWorker.terminate();pythonWorker=null;}return;}
    setMobileView('code');
    $('#python-code').textContent='변환 중...';$('#python-warning').textContent='';
    if(pythonWorker)pythonWorker.terminate();
    try{pythonWorker=newWorker();}
    catch(_error){$('#python-code').textContent='Python 변환기를 시작할 수 없습니다.';return;}
    pythonWorker.onmessage=event=>{
      const data=event.data;if(data.type==='python'){
        $('#python-code').textContent=data.code;
        $('#python-warning').textContent=data.warnings.length?'주의: '+data.warnings.join(' · '):'한글 코드의 구문 트리를 Python으로 변환했습니다.';
      }else if(data.type==='python-error'){
        $('#python-code').textContent='';$('#python-warning').textContent=`${data.line||'?'}번째 줄: ${data.message}`;
      }
      if(pythonWorker){pythonWorker.terminate();pythonWorker=null;}
    };
    pythonWorker.onerror=()=>{$('#python-code').textContent='변환 중 오류가 발생했습니다.';};
    pythonWorker.postMessage({type:'python',source:source.value});
    $('#python-panel').scrollIntoView({behavior:'smooth',block:'nearest'});
  }
  function insertTab(evt) {
    if(evt.key!=='Tab')return;
    evt.preventDefault();
    const start=source.selectionStart,end=source.selectionEnd;
    if(evt.shiftKey){
      const rowStart=source.value.lastIndexOf('\n',start-1)+1;
      const prefix=source.value.slice(rowStart,start);
      const spaces=(prefix.match(/^ {1,4}/)||[''])[0].length;
      if(spaces){source.setRangeText('',rowStart,rowStart+spaces,'start');source.setSelectionRange(start-spaces,Math.max(start-spaces,end-spaces));}
    }else if(start!==end && source.value.slice(start,end).includes('\n')){
      const value=source.value,begin=value.lastIndexOf('\n',start-1)+1;
      const slice=value.slice(begin,end),replacement='    '+slice.replace(/\n/g,'\n    ');
      source.setRangeText(replacement,begin,end,'select');
    }else source.setRangeText('    ',start,end,'end');
    renderEditor();save();
  }
  function downloadCode() {
    const filename=(examples.find(e=>e.id===selectedId)?.title||'내 코드')+'.세종';
    const blob=new Blob([source.value],{type:'text/plain;charset=utf-8'});
    const url=URL.createObjectURL(blob),a=document.createElement('a');
    a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1500);
    toast(`${filename} 파일을 저장했습니다.`);
  }
  function base64Encode(str) {
    const bytes=new TextEncoder().encode(str);
    let result='';for(let i=0;i<bytes.length;i++) result+=String.fromCharCode(bytes[i]);
    return btoa(result).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/g,'');
  }
  function base64Decode(str) {
    const binary=atob(str.replace(/-/g,'+').replace(/_/g,'/'));
    return new TextDecoder().decode(Uint8Array.from(binary,c=>c.charCodeAt(0)));
  }
  async function copyText(text) {
    if(navigator.clipboard&&window.isSecureContext){try{await navigator.clipboard.writeText(text);return true;}catch(_e){}}
    const field=document.createElement('textarea');field.value=text;field.style.position='fixed';field.style.opacity='0';document.body.append(field);field.select();
    let result=false;try{result=document.execCommand('copy');}catch(_e){}
    field.remove();return result;
  }
  async function shareCode() {
    if(location.protocol==='file:'){
      const copied=await copyText(source.value);
      toast(copied?'로컬 파일에서는 코드 내용을 복사했습니다. 배포하면 링크 공유가 가능합니다.':'사이트를 배포하면 링크로 코드를 공유할 수 있습니다.');return;
    }
    if(source.value.length>4000){toast('공유 링크는 코드 4,000자까지 지원합니다. 파일로 내려받아 주세요.');return;}
    const url=location.origin+location.pathname+'#code='+base64Encode(source.value);
    const copied=await copyText(url);toast(copied?'현재 코드를 담은 공유 링크를 복사했습니다.':'주소창의 공유 링크를 복사해 주세요.');
    if(!copied)location.hash='code='+base64Encode(source.value);
  }
  let docsReturnFocus=null;
  function toggleDocsMenu(open) {
    $('#docs-drawer').classList.toggle('toc-open',open);
    $('#docs-menu-toggle').setAttribute('aria-expanded',String(open));
  }
  function toggleDocs(open, trigger=document.activeElement) {
    const drawer=$('#docs-drawer');
    if(open)docsReturnFocus=trigger;
    toggleDocsMenu(false);
    drawer.classList.toggle('hidden',!open);
    document.body.classList.toggle('docs-open',open);
    $('#docs-toggle').classList.toggle('hidden',open);
    $('#docs-toggle').setAttribute('aria-expanded',String(open));
    $('#header-docs').setAttribute('aria-expanded',String(open));
    if(open)drawer.focus();
    else if(docsReturnFocus?.isConnected)docsReturnFocus.focus();
  }
  function searchDocs() {
    const query=$('#docs-search').value.trim().toLocaleLowerCase('ko');
    let found=0;
    document.querySelectorAll('.reference-section').forEach(section=>{
      const match=!query||section.textContent.toLocaleLowerCase('ko').includes(query);
      section.hidden=!match;
      const link=document.querySelector(`.docs-toc a[href="#${section.id}"]`);
      if(link)link.hidden=!match;
      if(match)found++;
    });
    $('#docs-empty').classList.toggle('hidden',found>0);
    $('#docs-scroll').scrollTop=0;
  }
  function init() {
    showExamples();
    let original=null;
    try {original=localStorage.getItem('sejong_code');const id=localStorage.getItem('sejong_example');if(examples.some(e=>e.id===id))selectedId=id;}catch(_e){}
    if(location.hash.startsWith('#code=')) {
      try {const shared=base64Decode(location.hash.slice(6));if(shared.length<=10000)original=shared;}catch(_e){toast('공유 코드를 읽지 못했습니다. 기본 예제를 표시합니다.');}
    }
    setActiveExample(selectedId);
    loadedSource=original!==null?original:examples.find(e=>e.id===selectedId).code;
    setSource(loadedSource,false);
    source.addEventListener('input',()=>{renderEditor();save();updateCompletion();});
    source.addEventListener('scroll',syncScroll);
    source.addEventListener('click',updateCursor);
    source.addEventListener('keyup',updateCursor);
    source.addEventListener('keydown',e=>{
      if(e.key==='Escape')hideCompletion();
      if(e.key==='Tab'&&!e.shiftKey&&!$('#completion').classList.contains('hidden')){
        e.preventDefault();acceptCompletion($('#completion button').dataset.completion);return;
      }
      if(e.key==='Tab')insertTab(e);
      if(!e.isComposing && source.selectionStart===source.selectionEnd && ['(', '[', '{', '"', "'"].includes(e.key)){
        const close={'(':')','[':']','{':'}','"':'"',"'":"'"}[e.key];
        const next=source.value[source.selectionStart]||'';
        if((e.key==='"'||e.key==="'") && /[가-힣\w]/u.test(next))return;
        if(next===close && (e.key==='"'||e.key==="'")){e.preventDefault();source.setSelectionRange(source.selectionStart+1,source.selectionStart+1);return;}
        e.preventDefault();const pos=source.selectionStart;source.setRangeText(e.key+close,pos,pos,'end');source.setSelectionRange(pos+1,pos+1);renderEditor();save();hideCompletion();return;
      }
      if(e.key==='Enter'&&!e.ctrlKey&&!e.metaKey&&source.selectionStart===source.selectionEnd) {
        const currentStart=source.value.lastIndexOf('\n',source.selectionStart-1)+1;
        const prefix=source.value.slice(currentStart,source.selectionStart);
        const indentation=(prefix.match(/^\s*/)||[''])[0];
        e.preventDefault();source.setRangeText('\n'+indentation+(prefix.trimEnd().endsWith(':')?'    ':''),source.selectionStart,source.selectionEnd,'end');renderEditor();save();hideCompletion();
      }
    });
    document.addEventListener('keydown',e=>{
      if((e.ctrlKey||e.metaKey)&&e.key==='Enter'){e.preventDefault();run();}
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='s'){e.preventDefault();downloadCode();}
      if(e.key==='Escape'&&!$('#docs-drawer').classList.contains('hidden')){e.preventDefault();toggleDocs(false);}
    });
    $('#run-btn').addEventListener('click',run);$('#stop-btn').addEventListener('click',()=>stopRun());
    $('#reset-btn').addEventListener('click',()=>{const item=examples.find(e=>e.id===selectedId);setSource(item.code);emptyConsole();toast('현재 예제를 처음 상태로 되돌렸습니다.');});
    $('#download-btn').addEventListener('click',downloadCode);$('#share-btn').addEventListener('click',shareCode);
    $('#format-btn').addEventListener('click',formatCode);
    $('#python-btn').addEventListener('click',()=>togglePython($('#python-panel').classList.contains('hidden')));
    $('#close-python').addEventListener('click',()=>togglePython(false));
    $('#copy-python').addEventListener('click',async()=>toast(await copyText($('#python-code').textContent)?'Python 코드를 복사했습니다.':'복사하지 못했습니다.'));
    $('#completion').addEventListener('mousedown',event=>event.preventDefault());
    $('#completion').addEventListener('click',event=>{const button=event.target.closest('button[data-completion]');if(button)acceptCompletion(button.dataset.completion);});
    $('#input-form').addEventListener('submit',event=>{
      event.preventDefault();if(!waitingInput||!worker)return;
      const value=$('#input-value').value;$('#input-form').classList.add('hidden');waitingInput=false;
      appendOutput('입력: '+value,'is-system');setStatus('running','실행 중');$('#run-info').textContent='입력 후 실행 중';
      armTimeout(runId);worker.postMessage({type:'input-response',value});
    });
    $('#input-cancel').addEventListener('click',()=>stopRun());
    document.querySelectorAll('.mobile-view-tabs button').forEach(button=>button.addEventListener('click',()=>{
      if(button.dataset.view==='code')setMobileView('code');
      else setTab(button.dataset.view);
    }));
    $('#clear-btn').addEventListener('click',emptyConsole);
    $('#tab-output').addEventListener('click',()=>setTab('output'));
    $('#tab-graphic').addEventListener('click',()=>setTab('graphic'));
    $('#header-docs').addEventListener('click',event=>toggleDocs($('#docs-drawer').classList.contains('hidden'),event.currentTarget));
    $('#docs-toggle').addEventListener('click',event=>toggleDocs(true,event.currentTarget));
    $('#docs-close').addEventListener('click',()=>toggleDocs(false));
    $('#docs-menu-toggle').addEventListener('click',()=>toggleDocsMenu(!$('#docs-drawer').classList.contains('toc-open')));
    $('#docs-search').addEventListener('input',()=>{toggleDocsMenu(false);searchDocs();});
    $('.docs-toc').addEventListener('click',event=>{
      const link=event.target.closest('a[href^="#ref-"]');if(!link)return;
      const section=document.querySelector(link.getAttribute('href'));if(!section)return;
      event.preventDefault();toggleDocsMenu(false);
      const scroll=$('#docs-scroll');
      scroll.scrollTop+=section.getBoundingClientRect().top-scroll.getBoundingClientRect().top;
    });
    emptyConsole();
  }
  init();
})();
