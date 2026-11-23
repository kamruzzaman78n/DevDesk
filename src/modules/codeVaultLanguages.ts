export interface CodeLanguage {
  id: string;
  label: string;
  extension: string;
}

export const CODE_LANGUAGES: CodeLanguage[] = [
  { id: 'typescript', label: 'TypeScript', extension: '.ts' },
  { id: 'tsx', label: 'TypeScript JSX', extension: '.tsx' },
  { id: 'javascript', label: 'JavaScript', extension: '.js' },
  { id: 'jsx', label: 'JavaScript JSX', extension: '.jsx' },
  { id: 'python', label: 'Python', extension: '.py' },
  { id: 'java', label: 'Java', extension: '.java' },
  { id: 'kotlin', label: 'Kotlin', extension: '.kt' },
  { id: 'scala', label: 'Scala', extension: '.scala' },
  { id: 'groovy', label: 'Groovy', extension: '.groovy' },
  { id: 'c', label: 'C', extension: '.c' },
  { id: 'cpp', label: 'C++', extension: '.cpp' },
  { id: 'csharp', label: 'C#', extension: '.cs' },
  { id: 'go', label: 'Go', extension: '.go' },
  { id: 'rust', label: 'Rust', extension: '.rs' },
  { id: 'swift', label: 'Swift', extension: '.swift' },
  { id: 'objectivec', label: 'Objective-C', extension: '.m' },
  { id: 'ruby', label: 'Ruby', extension: '.rb' },
  { id: 'php', label: 'PHP', extension: '.php' },
  { id: 'perl', label: 'Perl', extension: '.pl' },
  { id: 'r', label: 'R', extension: '.r' },
  { id: 'julia', label: 'Julia', extension: '.jl' },
  { id: 'lua', label: 'Lua', extension: '.lua' },
  { id: 'dart', label: 'Dart', extension: '.dart' },
  { id: 'elixir', label: 'Elixir', extension: '.ex' },
  { id: 'erlang', label: 'Erlang', extension: '.erl' },
  { id: 'haskell', label: 'Haskell', extension: '.hs' },
  { id: 'ocaml', label: 'OCaml', extension: '.ml' },
  { id: 'clojure', label: 'Clojure', extension: '.clj' },
  { id: 'fsharp', label: 'F#', extension: '.fs' },
  { id: 'powershell', label: 'PowerShell', extension: '.ps1' },
  { id: 'bash', label: 'Bash / Shell', extension: '.sh' },
  { id: 'sql', label: 'SQL', extension: '.sql' },
  { id: 'html', label: 'HTML', extension: '.html' },
  { id: 'css', label: 'CSS', extension: '.css' },
  { id: 'scss', label: 'SCSS', extension: '.scss' },
  { id: 'less', label: 'Less', extension: '.less' },
  { id: 'json', label: 'JSON', extension: '.json' },
  { id: 'jsonc', label: 'JSON with Comments', extension: '.jsonc' },
  { id: 'yaml', label: 'YAML', extension: '.yaml' },
  { id: 'toml', label: 'TOML', extension: '.toml' },
  { id: 'xml', label: 'XML', extension: '.xml' },
  { id: 'markdown', label: 'Markdown', extension: '.md' },
  { id: 'mdx', label: 'MDX', extension: '.mdx' },
  { id: 'graphql', label: 'GraphQL', extension: '.graphql' },
  { id: 'dockerfile', label: 'Dockerfile', extension: 'Dockerfile' },
  { id: 'makefile', label: 'Makefile', extension: 'Makefile' },
  { id: 'cmake', label: 'CMake', extension: '.cmake' },
  { id: 'terraform', label: 'Terraform / HCL', extension: '.tf' },
  { id: 'vim', label: 'Vim Script', extension: '.vim' },
  { id: 'latex', label: 'LaTeX', extension: '.tex' },
  { id: 'matlab', label: 'MATLAB', extension: '.m' },
  { id: 'fortran', label: 'Fortran', extension: '.f90' },
  { id: 'pascal', label: 'Pascal', extension: '.pas' },
  { id: 'assembly', label: 'Assembly', extension: '.asm' },
  { id: 'verilog', label: 'Verilog', extension: '.v' },
  { id: 'vhdl', label: 'VHDL', extension: '.vhd' },
  { id: 'solidity', label: 'Solidity', extension: '.sol' },
  { id: 'wasm', label: 'WebAssembly', extension: '.wat' },
  { id: 'protobuf', label: 'Protocol Buffers', extension: '.proto' },
  { id: 'diff', label: 'Diff / Patch', extension: '.diff' },
  { id: 'regex', label: 'Regular Expression', extension: '.regex' },
  { id: 'ini', label: 'INI', extension: '.ini' },
  { id: 'csv', label: 'CSV', extension: '.csv' },
  { id: 'http', label: 'HTTP', extension: '.http' },
  { id: 'prisma', label: 'Prisma', extension: '.prisma' },
  { id: 'awk', label: 'Awk', extension: '.awk' },
  { id: 'fish', label: 'Fish', extension: '.fish' },
  { id: 'nix', label: 'Nix', extension: '.nix' },
  { id: 'elm', label: 'Elm', extension: '.elm' },
  { id: 'vue', label: 'Vue', extension: '.vue' },
  { id: 'svelte', label: 'Svelte', extension: '.svelte' },
  { id: 'astro', label: 'Astro', extension: '.astro' },
  { id: 'handlebars', label: 'Handlebars', extension: '.hbs' },
  { id: 'django', label: 'Django Template', extension: '.html' },
  { id: 'nginx', label: 'Nginx Config', extension: '.conf' },
  { id: 'graphql-sdl', label: 'GraphQL SDL', extension: '.gql' },
  { id: 'plaintext', label: 'Plain Text', extension: '.txt' },
];

const COMMON_KEYWORDS = new Set(
  `as async await break case catch class const continue debugger default delete do else export extends false finally for from function get if import in instanceof let new null of return set static super switch this throw true try typeof undefined var void while with yield`.split(
    ' ',
  ),
);
const C_FAMILY_KEYWORDS = new Set(
  `${Array.from(COMMON_KEYWORDS).join(' ')} auto bool char const double extern float int long register short signed sizeof static struct typedef union unsigned void volatile class namespace template typename using virtual public private protected new delete operator this try catch throw`.split(
    ' ',
  ),
);
const RUST_KEYWORDS = new Set(
  `${Array.from(COMMON_KEYWORDS).join(' ')} as async await break const crate dyn else enum extern fn for impl in let loop match mod move mut pub ref return self Self static struct trait type unsafe use where`.split(
    ' ',
  ),
);
const GO_KEYWORDS = new Set(
  `${Array.from(COMMON_KEYWORDS).join(' ')} chan defer fallthrough go goto interface map package range select struct`.split(
    ' ',
  ),
);
const SHELL_KEYWORDS = new Set(
  `${Array.from(COMMON_KEYWORDS).join(' ')} case do done elif else esac fi for function if in select then time until while`.split(
    ' ',
  ),
);
const KEYWORDS_BY_LANGUAGE: Record<string, Set<string>> = {
  typescript: new Set(`${'interface type enum implements private protected public readonly abstract declare keyof namespace module infer is satisfies'} ${'number string boolean any unknown never object symbol bigint'} ${Array.from(COMMON_KEYWORDS).join(' ')}`.split(' ')),
  tsx: new Set(`${'interface type enum implements private protected public readonly abstract declare keyof namespace module infer is satisfies'} ${Array.from(COMMON_KEYWORDS).join(' ')}`.split(' ')),
  javascript: COMMON_KEYWORDS,
  jsx: COMMON_KEYWORDS,
  java: C_FAMILY_KEYWORDS,
  kotlin: C_FAMILY_KEYWORDS,
  scala: C_FAMILY_KEYWORDS,
  groovy: C_FAMILY_KEYWORDS,
  c: C_FAMILY_KEYWORDS,
  cpp: C_FAMILY_KEYWORDS,
  csharp: C_FAMILY_KEYWORDS,
  objectivec: C_FAMILY_KEYWORDS,
  swift: C_FAMILY_KEYWORDS,
  go: GO_KEYWORDS,
  rust: RUST_KEYWORDS,
  python: new Set('and as assert async await break class continue def del elif else except False finally for from global if import in is lambda None nonlocal not or pass raise return True try while with yield'.split(' ')),
  sql: new Set('add all alter as asc begin between by case cast check column commit constraint create cross current_date current_timestamp database default delete desc distinct drop else end except exists fetch foreign from full grant group having in index inner insert intersect into is join key left like limit not null offset on or order outer primary procedure references revoke right rollback row select set table then trigger truncate union unique update use values view when where with'.split(' ')),
  json: new Set(['true', 'false', 'null']),
  jsonc: new Set(['true', 'false', 'null']),
  html: new Set(['DOCTYPE']),
  css: new Set('important media supports keyframes font-face import namespace'.split(' ')),
  yaml: new Set(['true', 'false', 'null', 'yes', 'no', 'on', 'off']),
  bash: SHELL_KEYWORDS,
  fish: SHELL_KEYWORDS,
  powershell: SHELL_KEYWORDS,
};

const LINE_COMMENTS: Record<string, string[]> = {
  python: ['#'], ruby: ['#'], perl: ['#'], r: ['#'], yaml: ['#'], toml: ['#'], ini: ['#', ';'],
  bash: ['#'], powershell: ['#'], makefile: ['#'], dockerfile: ['#'], nginx: ['#'], nix: ['#'],
  sql: ['--'], haskell: ['--'], lua: ['--'], javascript: ['//'], typescript: ['//'], tsx: ['//'],
  jsx: ['//'], java: ['//'], kotlin: ['//'], scala: ['//'], groovy: ['//'], c: ['//'], cpp: ['//'],
  csharp: ['//'], go: ['//'], rust: ['//'], swift: ['//'], objectivec: ['//'], php: ['//', '#'],
  dart: ['//'], elixir: ['#'], erlang: ['%'], ocaml: ['(*'], clojure: [';'], fsharp: ['//'],
  css: [], scss: ['//'], less: ['//'], graphql: ['#'], terraform: ['#', '//'], matlab: ['%'],
  fortran: ['!'], pascal: ['//'], assembly: [';'], verilog: ['//'], vhdl: ['--'], solidity: ['//'],
  awk: ['#'], fish: ['#'], elm: ['--'], prisma: ['//'], vim: ['"'],
};

export interface HighlightToken {
  text: string;
  kind: 'plain' | 'keyword' | 'string' | 'comment' | 'number' | 'function' | 'operator';
}

function isIdentifierStart(char: string): boolean {
  return /[A-Za-z_$]/.test(char);
}

function isIdentifierPart(char: string): boolean {
  return /[\w$]/.test(char);
}

export function highlightCode(code: string, language: string): HighlightToken[] {
  const tokens: HighlightToken[] = [];
  const keywords = KEYWORDS_BY_LANGUAGE[language] || COMMON_KEYWORDS;
  const lineComments = LINE_COMMENTS[language] || ['//', '#'];
  let index = 0;

  const add = (text: string, kind: HighlightToken['kind']) => {
    if (!text) return;
    const previous = tokens[tokens.length - 1];
    if (previous?.kind === kind && kind === 'plain') previous.text += text;
    else tokens.push({ text, kind });
  };

  while (index < code.length) {
    const rest = code.slice(index);
    if (/\s/.test(code[index])) {
      const whitespace = /^\s+/.exec(rest)?.[0] || code[index];
      add(whitespace, 'plain');
      index += whitespace.length;
      continue;
    }

    if (rest.startsWith('/*') || rest.startsWith('<!--') || rest.startsWith('(*')) {
      const close = rest.startsWith('<!--') ? '-->' : rest.startsWith('(*') ? '*)' : '*/';
      const end = rest.indexOf(close, close.length);
      const comment = end < 0 ? rest : rest.slice(0, end + close.length);
      add(comment, 'comment');
      index += comment.length;
      continue;
    }
    if (language === 'lua' && rest.startsWith('--[[')) {
      const end = rest.indexOf(']]', 4);
      const comment = end < 0 ? rest : rest.slice(0, end + 2);
      add(comment, 'comment');
      index += comment.length;
      continue;
    }

    const lineComment = lineComments.find((marker) => rest.startsWith(marker));
    if (lineComment) {
      const newline = rest.indexOf('\n');
      const comment = newline < 0 ? rest : rest.slice(0, newline);
      add(comment, 'comment');
      index += comment.length;
      continue;
    }

    if (code[index] === '"' || code[index] === "'" || code[index] === '`') {
      const quote = code[index];
      const triple = language === 'python' && rest.startsWith(quote.repeat(3));
      const delimiter = triple ? quote.repeat(3) : quote;
      let end = delimiter.length;
      while (end < rest.length) {
        if (rest[end] === '\\') {
          end += 2;
        } else if (rest.startsWith(delimiter, end)) {
          end += delimiter.length;
          break;
        } else {
          end += 1;
        }
      }
      const string = rest.slice(0, end);
      add(string, 'string');
      index += string.length;
      continue;
    }

    const number = /^(?:0[xob][\da-f]+|(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?n?)/i.exec(rest)?.[0];
    if (number) {
      add(number, 'number');
      index += number.length;
      continue;
    }
    if (isIdentifierStart(code[index])) {
      let end = index + 1;
      while (end < code.length && isIdentifierPart(code[end])) end += 1;
      const identifier = code.slice(index, end);
      const nextNonSpace = code.slice(end).match(/^\s*(.)/)?.[1];
      if (keywords.has(identifier)) add(identifier, 'keyword');
      else if (nextNonSpace === '(') add(identifier, 'function');
      else add(identifier, 'plain');
      index = end;
      continue;
    }
    if (/[=+\-*/%<>!&|^~?:]/.test(code[index])) {
      add(code[index], 'operator');
      index += 1;
      continue;
    }
    add(code[index], 'plain');
    index += 1;
  }
  return tokens;
}
