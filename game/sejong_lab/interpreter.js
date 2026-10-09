/* 세종 개발실 - 브라우저용 한글 프로그래밍 언어 해석기 (Worker 실행) */
(() => {
  'use strict';
  class SejongError extends Error {
    constructor(line, message) { super(message); this.name = 'SejongError'; this.line = line || 0; }
  }
  const fail = (line, message) => { throw new SejongError(line, message); };
  const identifier = '[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_][가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_0-9]*';
  const isIdentifier = text => new RegExp('^' + identifier + '$', 'u').test(text);

  function removeComment(line) {
    let quote = null, escaped = false;
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (escaped) { escaped = false; continue; }
      if (quote && c === '\\') { escaped = true; continue; }
      if (quote) { if (c === quote) quote = null; continue; }
      if (c === '"' || c === "'") { quote = c; continue; }
      if (c === '#') return line.slice(0, i);
    }
    return line;
  }

  function tokenize(src, line) {
    const tokens = [];
    let i = 0;
    while (i < src.length) {
      const char = src[i];
      if (/\s/u.test(char)) { i++; continue; }
      if (char === '"' || char === "'") {
        const quote = char; i++;
        let value = '', closed = false;
        while (i < src.length) {
          let c = src[i++];
          if (c === quote) { closed = true; break; }
          if (c === '\\') {
            if (i >= src.length) fail(line, '문자열의 끝에 잘못된 역슬래시가 있습니다.');
            const n = src[i++];
            value += n === 'n' ? '\n' : n === 't' ? '\t' : n === 'r' ? '\r' : n;
          } else value += c;
        }
        if (!closed) fail(line, '문자열을 닫는 따옴표가 없습니다.');
        tokens.push({kind: 'literal', value}); continue;
      }
      if (/[0-9]/.test(char)) {
        let number = '';
        while (i < src.length && /[0-9]/.test(src[i])) number += src[i++];
        if (src[i] === '.' && /[0-9]/.test(src[i+1] || '')) {
          number += src[i++];
          while (i < src.length && /[0-9]/.test(src[i])) number += src[i++];
        }
        tokens.push({kind: 'literal', value: Number(number)}); continue;
      }
      if (/[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_]/u.test(char)) {
        let word = '';
        while (i < src.length && /[가-힣ㄱ-ㅎㅏ-ㅣA-Za-z_0-9]/u.test(src[i])) word += src[i++];
        tokens.push({kind: 'word', value: word}); continue;
      }
      const two = src.slice(i, i+2);
      if (['==', '!=', '<=', '>=', '//'].includes(two)) {
        tokens.push({kind: 'op', value: two}); i += 2; continue;
      }
      if ('+-*/%()[],<>'.includes(char)) {
        tokens.push({kind: 'op', value: char}); i++; continue;
      }
      fail(line, `알 수 없는 기호 '${char}'가 있습니다.`);
    }
    tokens.push({kind: 'end', value: '<끝>'});
    return tokens;
  }

  function parseExpr(source, line) {
    const tokens = tokenize(source, line);
    let current = 0;
    const peek = () => tokens[current];
    const has = value => peek().value === value;
    const consume = value => { if (!has(value)) fail(line, `'${value}'가 필요합니다. 현재: '${peek().value}'`); current++; };
    const next = () => tokens[current++];
    function parseOr() {
      let node = parseAnd();
      while (has('또는')) { next(); node = {type:'binary',op:'또는',left:node,right:parseAnd()}; }
      return node;
    }
    function parseAnd() {
      let node = parseCmp();
      while (has('그리고')) { next(); node = {type:'binary',op:'그리고',left:node,right:parseCmp()}; }
      return node;
    }
    function parseCmp() {
      let node = parseAdd();
      while (['==','!=','<','>','<=','>='].includes(peek().value)) {
        const op = next().value; node = {type:'binary',op,left:node,right:parseAdd()};
      }
      return node;
    }
    function parseAdd() {
      let node = parseMul();
      while (['+','-'].includes(peek().value)) {
        const op = next().value; node = {type:'binary',op,left:node,right:parseMul()};
      }
      return node;
    }
    function parseMul() {
      let node = parseUnary();
      while (['*','/','//','%'].includes(peek().value)) {
        const op = next().value; node = {type:'binary',op,left:node,right:parseUnary()};
      }
      return node;
    }
    function parseUnary() {
      if (['-','+','아니다'].includes(peek().value)) {
        const op = next().value; return {type:'unary',op,expr:parseUnary()};
      }
      return parsePostfix();
    }
    function parsePostfix() {
      let node = parsePrimary();
      while (true) {
        if (has('(')) {
          next(); const args=[];
          if (!has(')')) {
            do { args.push(parseOr()); if (!has(',')) break; next(); } while (true);
          }
          consume(')'); node={type:'call',callee:node,args};
        } else if (has('[')) {
          next(); const index=parseOr(); consume(']'); node={type:'index',target:node,index};
        } else break;
      }
      return node;
    }
    function parsePrimary() {
      const token=next();
      if (token.kind==='literal') return {type:'literal',value:token.value};
      if (token.kind==='word') {
        if (token.value==='참') return {type:'literal',value:true};
        if (token.value==='거짓') return {type:'literal',value:false};
        if (token.value==='없음') return {type:'literal',value:null};
        if (['그리고','또는','아니다'].includes(token.value)) fail(line, `'${token.value}'의 위치가 올바르지 않습니다.`);
        return {type:'identifier',name:token.value};
      }
      if (token.value==='(') { const node=parseOr();consume(')');return node; }
      if (token.value==='[') {
        const items=[];
        if (!has(']')) do { items.push(parseOr()); if (!has(',')) break; next(); } while(true);
        consume(']');return {type:'list',items};
      }
      fail(line, `'${token.value}' 근처에 올바른 값이 필요합니다.`);
    }
    const expression = parseOr();
    if (peek().kind!=='end') fail(line, `'${peek().value}' 앞뒤의 표현식을 확인해 주세요.`);
    return expression;
  }

  function parseProgram(source) {
    const allLines = source.replace(/\r\n?/g,'\n').split('\n');
    const lines = allLines.map((raw,i) => {
      const leading = (raw.match(/^[ \t]*/) || [''])[0];
      const indent = [...leading].reduce((n,c) => n+(c==='\t'?4:1),0);
      return {text:removeComment(raw).trim(), indent, line:i+1};
    }).filter(item => item.text);
    let p=0;
    const look=()=>lines[p];
    const statementExpr=(src,l)=>parseExpr(src,l);
    function parseBody(parent) {
      if (!look() || look().indent<=parent.indent) fail(parent.line,'다음 줄에 들여쓴 명령이 필요합니다.');
      return parseBlock(look().indent);
    }
    function parseBlock(indent) {
      const body=[];
      while (look() && look().indent>=indent) {
        const row=look();
        if (row.indent!==indent) fail(row.line,'들여쓰기 깊이가 올바르지 않습니다.');
        const text=row.text; p++;
        let match;
        if ((match=/^만약\s+(.+):$/u.exec(text))) {
          const node={type:'if',branches:[{test:statementExpr(match[1],row.line),body:parseBody(row)}],other:null,line:row.line};
          while (look() && look().indent===indent && /^아니고\s+만약\s+(.+):$/u.test(look().text)) {
            const cur=look(); p++;
            node.branches.push({test:statementExpr(/^아니고\s+만약\s+(.+):$/u.exec(cur.text)[1],cur.line),body:parseBody(cur)});
          }
          if (look() && look().indent===indent && look().text==='아니면:') {
            const cur=look();p++;node.other=parseBody(cur);
          }
          body.push(node); continue;
        }
        if (/^(아니고\s+만약|아니면)/u.test(text)) fail(row.line,'앞에 연결되는 `만약` 조건문이 없습니다.');
        if ((match=/^반복\s+(.+?)번:$/u.exec(text))) {
          body.push({type:'repeat',count:statementExpr(match[1].trim(),row.line),body:parseBody(row),line:row.line});continue;
        }
        if ((match=new RegExp('^반복\\s+('+identifier+')\\s+각각\\s+(.+)에서:$','u').exec(text))) {
          body.push({type:'foreach',name:match[1],iterable:statementExpr(match[2].trim(),row.line),body:parseBody(row),line:row.line});continue;
        }
        if ((match=/^반복\s+(.+?)인동안:$/u.exec(text))) {
          body.push({type:'while',test:statementExpr(match[1].trim(),row.line),body:parseBody(row),line:row.line});continue;
        }
        if ((match=new RegExp('^함수\\s+('+identifier+')\\s*\\((.*?)\\):$','u').exec(text))) {
          const params=match[2].trim()?match[2].split(',').map(s=>s.trim()):[];
          if (params.some(x=>!isIdentifier(x)) || new Set(params).size!==params.length) fail(row.line,'함수 매개변수의 이름이 잘못되었거나 중복되었습니다.');
          body.push({type:'function',name:match[1],params,body:parseBody(row),line:row.line});continue;
        }
        if ((match=/^돌려주기(?:\s+(.+))?$/u.exec(text))) {
          body.push({type:'return',expr:match[1]?statementExpr(match[1],row.line):null,line:row.line});continue;
        }
        if (text==='반복끝내기' || text==='다음반복') {
          body.push({type:text==='반복끝내기'?'break':'continue',line:row.line});continue;
        }
        if ((match=new RegExp('^('+identifier+')\\s*(\\+=|-=|\\*=|/=|%=|=(?!=))\\s*(.+)$','u').exec(text))) {
          body.push({type:'assign',name:match[1],op:match[2],expr:statementExpr(match[3],row.line),line:row.line});continue;
        }
        if (/^(함수|만약|반복|아니면|아니고)\b/u.test(text) || text.endsWith(':')) fail(row.line,'명령문의 형식이 올바르지 않습니다. 문법 도움말을 확인해 주세요.');
        const expr=statementExpr(text,row.line);
        if (expr.type!=='call') fail(row.line,'단독 표현식은 실행할 수 없습니다. 출력() 또는 변수 할당을 사용해 주세요.');
        body.push({type:'expr',expr,line:row.line});
      }
      return body;
    }
    if (!lines.length) return [];
    if (lines[0].indent!==0) fail(lines[0].line,'첫 번째 명령은 들여쓰기 없이 시작해야 합니다.');
    return parseBlock(0);
  }

  class Env {
    constructor(parent=null) { this.parent=parent;this.values=Object.create(null); }
    get(name,line) {
      if (Object.prototype.hasOwnProperty.call(this.values,name)) return this.values[name];
      if (this.parent) return this.parent.get(name,line);
      fail(line,`'${name}'이라는 변수나 함수를 찾지 못했습니다.`);
    }
    set(name,value) {this.values[name]=value;}
  }
  function repr(value) {
    if (value===null) return '없음';
    if (value===true) return '참';
    if (value===false) return '거짓';
    if (Array.isArray(value)) return '['+value.map(repr).join(', ')+']';
    if (value && value.type==='sejongFn') return `<함수 ${value.name}>`;
    return String(value);
  }
  function truthy(value) {return !!value && (!Array.isArray(value)||value.length>0);}
  const equal = (a,b) => JSON.stringify(a)===JSON.stringify(b);
  const number = (x,line) => { if(typeof x!=='number'||!Number.isFinite(x)) fail(line,'숫자가 필요한 곳에 다른 값이 들어왔습니다.'); return x; };

  function execute(source, emit) {
    const ast=parseProgram(source);
    const global=new Env();
    let steps=0, count=0, depth=0;
    const guard=line=>{ if (++steps>60000) fail(line,'실행 단계 제한(60,000회)을 넘었습니다. 반복문을 확인해 주세요.'); };
    const output=(text,line)=>{
      count++;
      if (count>250) fail(line,'출력 제한(250줄)을 넘었습니다. 반복 횟수를 줄여 주세요.');
      emit({type:'output',text});
    };
    const builtins={
      출력(args,line) {output(args.map(repr).join(' '),line);return null;},
      길이(args,line) {
        if (args.length!==1 || !(typeof args[0]==='string'||Array.isArray(args[0]))) fail(line,'길이()에는 문자열 또는 목록 하나를 넣어 주세요.');
        return args[0].length;
      },
      글자열(args,line) {if(args.length!==1) fail(line,'글자열()에는 값 하나가 필요합니다.');return repr(args[0]);},
      숫자(args,line) {if(args.length!==1) fail(line,'숫자()에는 값 하나가 필요합니다.');const v=Number(args[0]);if(!Number.isFinite(v)) fail(line,'숫자로 바꿀 수 없는 값입니다.');return v;},
      정수(args,line) {if(args.length!==1) fail(line,'정수()에는 값 하나가 필요합니다.');return Math.trunc(number(Number(args[0]),line));},
      절댓값(args,line) {if(args.length!==1) fail(line,'절댓값()에는 숫자 하나가 필요합니다.');return Math.abs(number(args[0],line));},
      최댓값(args,line) {if(!args.length) fail(line,'최댓값()에는 하나 이상의 숫자가 필요합니다.');return Math.max(...args.map(x=>number(x,line)));},
      최솟값(args,line) {if(!args.length) fail(line,'최솟값()에는 하나 이상의 숫자가 필요합니다.');return Math.min(...args.map(x=>number(x,line)));}
    };
    function applyBinary(op,a,b,line) {
      switch(op) {
        case '+': return typeof a==='string'||typeof b==='string' ? repr(a)+repr(b) : number(a,line)+number(b,line);
        case '-': return number(a,line)-number(b,line);
        case '*': return number(a,line)*number(b,line);
        case '/': if(number(b,line)===0) fail(line,'0으로 나눌 수 없습니다.');return number(a,line)/b;
        case '//': if(number(b,line)===0) fail(line,'0으로 나눌 수 없습니다.');return Math.floor(number(a,line)/b);
        case '%': if(number(b,line)===0) fail(line,'0으로 나눌 수 없습니다.');return number(a,line)%b;
        case '==':return equal(a,b);
        case '!=':return !equal(a,b);
        case '>':return a>b;
        case '<':return a<b;
        case '>=':return a>=b;
        case '<=':return a<=b;
      }
      fail(line,`지원하지 않는 연산자 '${op}'입니다.`);
    }
    function evaluate(node,env,line) {
      guard(line);
      switch(node.type) {
        case 'literal':return node.value;
        case 'identifier':return env.get(node.name,line);
        case 'list':return node.items.map(n=>evaluate(n,env,line));
        case 'index': {
          const target=evaluate(node.target,env,line),i=evaluate(node.index,env,line);
          if (!(Array.isArray(target)||typeof target==='string')) fail(line,'대괄호로 접근할 수 있는 값은 목록 또는 문자열입니다.');
          if(!Number.isInteger(i)||i<0||i>=target.length) fail(line,`목록의 인덱스 ${repr(i)}가 범위를 벗어났습니다.`);
          return target[i];
        }
        case 'unary': {
          const v=evaluate(node.expr,env,line);
          if(node.op==='아니다')return !truthy(v);
          return node.op==='-'?-number(v,line):number(v,line);
        }
        case 'binary': {
          const a=evaluate(node.left,env,line);
          if(node.op==='그리고') return truthy(a) ? truthy(evaluate(node.right,env,line)) : false;
          if(node.op==='또는') return truthy(a) ? true : truthy(evaluate(node.right,env,line));
          return applyBinary(node.op,a,evaluate(node.right,env,line),line);
        }
        case 'call': {
          if(node.callee.type!=='identifier') fail(line,'함수 이름 뒤에 괄호를 사용해야 합니다.');
          const name=node.callee.name,args=node.args.map(x=>evaluate(x,env,line));
          if(Object.prototype.hasOwnProperty.call(builtins,name)) return builtins[name](args,line);
          const fn=env.get(name,line);
          if (!fn || fn.type!=='sejongFn') fail(line,`'${name}'은 실행 가능한 함수가 아닙니다.`);
          if (args.length!==fn.params.length) fail(line,`'${name}' 함수에는 인자 ${fn.params.length}개가 필요합니다.`);
          if(++depth>40) fail(line,'함수를 너무 깊게 호출했습니다(재귀 호출 40단계).');
          try {
            const local=new Env(fn.env);
            fn.params.forEach((p,i)=>local.set(p,args[i]));
            const result=runBlock(fn.body,local,{inFunction:true,loops:0});
            if(result && result.kind==='return')return result.value;
            return null;
          } finally {depth--;}
        }
      }
      fail(line,'해석할 수 없는 표현식입니다.');
    }
    function runLoop(body,env,ctx) {
      const flow=runBlock(body,env,{...ctx,loops:ctx.loops+1});
      if(flow && flow.kind==='break')return 'break';
      if(flow && flow.kind==='continue')return 'continue';
      if(flow && flow.kind==='return')return flow;
      return null;
    }
    function runBlock(nodes,env,ctx) {
      for (const node of nodes) {
        guard(node.line);
        switch(node.type) {
          case 'assign': {
            const value=evaluate(node.expr,env,node.line);
            const next=node.op==='='?value:applyBinary(node.op.slice(0,-1),env.get(node.name,node.line),value,node.line);
            env.set(node.name,next);break;
          }
          case 'expr':evaluate(node.expr,env,node.line);break;
          case 'function':env.set(node.name,{type:'sejongFn',name:node.name,params:node.params,body:node.body,env});break;
          case 'if': {
            let taken=false;
            for(const branch of node.branches) {
              if(truthy(evaluate(branch.test,env,node.line))) {
                const flow=runBlock(branch.body,env,ctx);if(flow)return flow;
                taken=true;break;
              }
            }
            if(!taken && node.other) {const flow=runBlock(node.other,env,ctx);if(flow)return flow;}
            break;
          }
          case 'repeat': {
            const n=evaluate(node.count,env,node.line);
            if(!Number.isInteger(n)||n<0||n>60000) fail(node.line,'반복 횟수는 0에서 60,000 사이의 정수여야 합니다.');
            for(let i=0;i<n;i++) {
              guard(node.line);
              const flow=runLoop(node.body,env,ctx);
              if(flow==='break')break;
              if(flow && typeof flow==='object')return flow;
            }
            break;
          }
          case 'foreach': {
            const list=evaluate(node.iterable,env,node.line);
            if(!Array.isArray(list)&&typeof list!=='string') fail(node.line,'각각 반복하려면 목록 또는 문자열이 필요합니다.');
            for(const val of list) {
              guard(node.line);env.set(node.name,val);
              const flow=runLoop(node.body,env,ctx);
              if(flow==='break')break;
              if(flow && typeof flow==='object')return flow;
            }
            break;
          }
          case 'while': {
            while(truthy(evaluate(node.test,env,node.line))) {
              guard(node.line);
              const flow=runLoop(node.body,env,ctx);
              if(flow==='break')break;
              if(flow && typeof flow==='object')return flow;
            }
            break;
          }
          case 'return':if(!ctx.inFunction)fail(node.line,'돌려주기는 함수 안에서만 사용할 수 있습니다.');
            return {kind:'return',value:node.expr?evaluate(node.expr,env,node.line):null};
          case 'break':case 'continue':
            if(!ctx.loops)fail(node.line,`${node.type==='break'?'반복끝내기':'다음반복'}는 반복문 안에서만 사용할 수 있습니다.`);
            return {kind:node.type};
        }
      }
      return null;
    }
    runBlock(ast,global,{inFunction:false,loops:0});
    return {steps,outputs:count};
  }

  self.onmessage=event=>{
    const {source}=event.data||{};
    if(typeof source!=='string')return;
    const started=Date.now();
    try {
      const stats=execute(source,payload=>self.postMessage(payload));
      self.postMessage({type:'done',duration:Date.now()-started,...stats});
    }catch(error) {
      self.postMessage({type:'error',message:error instanceof SejongError?error.message:'예기치 않은 실행 오류가 발생했습니다.',line:error.line||0});
    }
  };
})();
