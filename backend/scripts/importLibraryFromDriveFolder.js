import '../config/env.js';
import { supabaseAdmin } from '../db/supabaseClient.js';

const DEFAULT_FOLDER_URL = 'https://drive.google.com/drive/folders/1bmwnYFNkRo2R0Xgb8hYG-6tFBn7TDTkH?usp=sharing';

function ensureSafeDriveFolderUrl(folderUrl) {
  const parsed = new URL(String(folderUrl || DEFAULT_FOLDER_URL));
  const safeHosts = new Set(['drive.google.com', 'docs.google.com']);
  const isSafePath = parsed.pathname.includes('/folders/');

  if (parsed.protocol !== 'https:' || !safeHosts.has(parsed.hostname) || !isSafePath) {
    throw new Error(`Unsafe Google Drive folder URL: ${folderUrl}`);
  }

  return parsed.toString();
}

function parseArgs(argv) {
  const args = {
    folderUrl: DEFAULT_FOLDER_URL,
    dryRun: false,
    refreshExisting: false
  };

  for (const arg of argv) {
    if (arg.startsWith('--folder=')) {
      args.folderUrl = arg.slice('--folder='.length);
    }
    if (arg === '--dry-run') {
      args.dryRun = true;
    }
    if (arg === '--refresh-existing') {
      args.refreshExisting = true;
    }
  }

  return args;
}

function extractFolderId(folderUrl) {
  const match = folderUrl.match(/\/folders\/([a-zA-Z0-9_-]+)/);
  if (!match) {
    throw new Error(`Unable to parse folder id from URL: ${folderUrl}`);
  }
  return match[1];
}

function decodeEscapes(text) {
  const xDoubleDecoded = text.replace(/\\\\x([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  const xDecoded = xDoubleDecoded.replace(/\\x([0-9a-fA-F]{2})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  const uDoubleDecoded = xDecoded.replace(/\\\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  const uDecoded = uDoubleDecoded.replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) =>
    String.fromCharCode(parseInt(hex, 16))
  );

  return uDecoded
    .replace(/\//g, '/')
    .replace(/\\"/g, '"');
}

const DRIVE_FOLDER_MIME = 'application/vnd.google-apps.folder';
const PDF_MIME = 'application/pdf';

function normalizeWhitespace(input) {
  return input.replace(/[._]+/g, ' ').replace(/\s+/g, ' ').trim();
}

function normalizeLabel(input) {
  return normalizeWhitespace(input)
    .replace(/-+/g, ' ')
    .replace(/[\]{}]/g, ' ')
    .replace(/\s*\([^)]*\)\s*$/g, ' ')
    .replace(/\bpdf\b$/i, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeAcronyms(input) {
  return input
    .replace(/\bAi\b/g, 'AI')
    .replace(/\bMl\b/g, 'ML')
    .replace(/\bDsa\b/g, 'DSA')
    .replace(/\bOs\b/g, 'OS')
    .replace(/\bC\+\+\b/g, 'C++')
    .replace(/\bJs\b/g, 'JS')
    .replace(/\bPhp\b/g, 'PHP');
}

function slugify(input) {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeForMatch(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
}

function inferAuthorFromTitle(title) {
  const t = normalizeForMatch(title);

  const rules = [
    {
      match: /^(ai russell norvig|artificial intelligence)$/,
      author: 'Stuart Russell, Peter Norvig'
    },
    {
      match: /cracking the coding interview/,
      author: 'Gayle Laakmann McDowell'
    },
    {
      match: /introduction to algorithms/,
      author: 'Thomas H. Cormen, Charles E. Leiserson, Ronald L. Rivest, Clifford Stein'
    },
    {
      match: /head first java/,
      author: 'Kathy Sierra, Bert Bates'
    },
    {
      match: /computer networking a top down approach/,
      author: 'James F. Kurose, Keith W. Ross'
    },
    {
      match: /(computer networks.*tanenbaum|tanenbaum.*computer networks)/,
      author: 'Andrew S. Tanenbaum'
    },
    {
      match: /prentice hall computer networks tanenbaum/,
      author: 'Andrew S. Tanenbaum'
    },
    {
      match: /operating systems$/,
      author: 'Abraham Silberschatz, Peter B. Galvin, Greg Gagne'
    },
    {
      match: /algorithm design manual/,
      author: 'Steven S. Skiena'
    },
    {
      match: /automata theory languages and computation/,
      author: 'John E. Hopcroft, Rajeev Motwani, Jeffrey D. Ullman'
    },
    {
      match: /switching and finite automata theory/,
      author: 'Zvi Kohavi, Niraj K. Jha'
    },
    {
      match: /cloud computing concepts technology.*architecture.*thomas erl/,
      author: 'Thomas Erl'
    },
    {
      match: /building reactive microservices in java/,
      author: 'Manu Joseph'
    }
  ];

  const found = rules.find((rule) => rule.match.test(t));
  return found ? found.author : null;
}

function inferAuthorFromRawName(rawName) {
  const noExt = rawName.replace(/\.pdf$/i, '').trim();
  const byMatch = noExt.match(/^(.*)\s+by\s+(.+)$/i);
  if (!byMatch) return null;

  const rawAuthor = normalizeLabel(byMatch[2]);
  if (!rawAuthor) return null;
  return toDisplayCase(normalizeAcronyms(rawAuthor));
}

function isLikelyNonPersonAuthor(author) {
  const a = normalizeForMatch(author);
  return [
    'prentice hall',
    'pearson',
    'mit press',
    'cambridge university press',
    'addison wesley',
    'oreilly',
    'unknown'
  ].includes(a);
}

function toDisplayCase(input) {
  const acronyms = new Set(['AI', 'ML', 'DSA', 'OS', 'JS', 'PHP', 'API', 'SQL', 'C++']);

  return input
    .split(' ')
    .filter(Boolean)
    .map((word) => {
      const upperWord = word.toUpperCase();
      if (acronyms.has(upperWord)) {
        return upperWord;
      }
      if (/^[A-Z]{2,}$/.test(word)) {
        return word;
      }
      if (/^\d/.test(word)) {
        return word;
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

function guessCategory(text) {
  const t = text.toLowerCase();

  if (/algorithm|dsa|coding interview|automata|data structure/.test(t)) return 'DSA';
  if (/system design|distributed|architecture|microservice|design pattern/.test(t)) return 'System Design';
  if (/operating system|network|computer organization|cloud/.test(t)) return 'Computer Science';
  if (/java|c\+\+|python|php|next js|programming/.test(t)) return 'Programming';
  if (/ai|artificial intelligence|machine learning|ml/.test(t)) return 'AI/ML';
  if (/security|hacking|penetration/.test(t)) return 'Cybersecurity';

  return 'Programming';
}

function guessDifficulty(text) {
  const t = text.toLowerCase();
  if (/introduction|hands-on|head first|recipes/.test(t)) return 'Beginner';
  if (/advanced|data-intensive|distributed|modern operating systems/.test(t)) return 'Advanced';
  return 'Intermediate';
}

function deriveBookFields(fileName, fileUrl) {
  const noExt = fileName.replace(/\.pdf$/i, '').trim();
  let author = 'Unknown';
  let title = noExt;

  const authorFromByPattern = inferAuthorFromRawName(fileName);
  if (authorFromByPattern) {
    const byTitle = noExt.replace(/\s+by\s+.+$/i, '');
    title = toDisplayCase(normalizeAcronyms(normalizeLabel(byTitle)));
    author = authorFromByPattern;
  }

  const split = noExt.split(' - ');
  if (author === 'Unknown' && split.length >= 2) {
    author = toDisplayCase(normalizeAcronyms(normalizeLabel(split[0])));
    title = toDisplayCase(normalizeAcronyms(normalizeLabel(split.slice(1).join(' - '))));
  } else if (author === 'Unknown') {
    title = toDisplayCase(normalizeAcronyms(normalizeLabel(noExt)));
  }

  if (!title) {
    title = 'Untitled Book';
  }

  const inferredAuthor = inferAuthorFromTitle(title);
  if ((author === 'Unknown' || isLikelyNonPersonAuthor(author)) && inferredAuthor) {
    author = inferredAuthor;
  }

  const sourceText = `${title} ${author}`;
  const category = guessCategory(sourceText);
  const difficulty = guessDifficulty(sourceText);

  return {
    title,
    author,
    category,
    difficulty_level: difficulty,
    resource_url: fileUrl,
    description: `Imported from shared Google Drive folder: ${normalizeAcronyms(normalizeLabel(fileName))}`,
    tags: ['imported', 'google-drive', slugify(category)],
    language: 'English',
    approved: true
  };
}

function _parsePdfEntriesFromHtml(html, folderId) {
  const decoded = decodeEscapes(html);

  const pattern = /\["([a-zA-Z0-9_-]{10,})",\["([a-zA-Z0-9_-]{10,})"\],"((?:[^"\\]|\\.)*)","([^"]+)",/g;

  const seen = new Set();
  const items = [];

  let match;
  while ((match = pattern.exec(decoded)) !== null) {
    const [, id, parentId, rawName, mime] = match;

    if (parentId !== folderId) {
      continue;
    }

    if (mime !== 'application/pdf') {
      continue;
    }

    if (seen.has(id)) {
      continue;
    }

    seen.add(id);

    const fileName = normalizeWhitespace(rawName.replace(/\\"/g, '"'));
    const fileUrl = `https://drive.google.com/file/d/${id}/view?usp=sharing`;

    items.push({ id, fileName, fileUrl });
  }

  return items;
}

function parseDriveEntriesFromHtml(html, folderId) {
  const decoded = decodeEscapes(html);
  const pattern = /\["([a-zA-Z0-9_-]{10,})",\["([a-zA-Z0-9_-]{10,})"\],"((?:[^"\\]|\\.)*)","([^"]+)",/g;

  const entries = [];
  const seen = new Set();

  let match;
  while ((match = pattern.exec(decoded)) !== null) {
    const [, id, parentId, rawName, mime] = match;
    if (parentId !== folderId) continue;
    if (seen.has(id)) continue;

    seen.add(id);
    entries.push({
      id,
      parentId,
      fileName: normalizeWhitespace(rawName.replace(/\\"/g, '"')),
      mime
    });
  }

  return entries;
}

async function fetchDriveFolderHtml(folderUrl) {
  const safeFolderUrl = ensureSafeDriveFolderUrl(folderUrl);
  const response = await fetch(safeFolderUrl, {
    headers: {
      'User-Agent': 'Mozilla/5.0'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch folder URL (${response.status} ${response.statusText})`);
  }

  return response.text();
}

function fetchDriveFolderHtmlById(folderId) {
  const folderUrl = `https://drive.google.com/drive/folders/${folderId}?usp=sharing`;
  return fetchDriveFolderHtml(folderUrl);
}

async function collectPdfEntriesRecursively(rootFolderId) {
  const visitedFolders = new Set();
  const queuedFolders = [rootFolderId];
  const pdfsById = new Map();

  while (queuedFolders.length > 0) {
    const currentFolderId = queuedFolders.shift();
    if (visitedFolders.has(currentFolderId)) continue;

    visitedFolders.add(currentFolderId);

    const html = await fetchDriveFolderHtmlById(currentFolderId);
    const entries = parseDriveEntriesFromHtml(html, currentFolderId);

    for (const entry of entries) {
      if (entry.mime === DRIVE_FOLDER_MIME) {
        if (!visitedFolders.has(entry.id)) {
          queuedFolders.push(entry.id);
        }
        continue;
      }

      if (entry.mime !== PDF_MIME) {
        continue;
      }

      if (!pdfsById.has(entry.id)) {
        pdfsById.set(entry.id, {
          id: entry.id,
          fileName: entry.fileName,
          fileUrl: `https://drive.google.com/file/d/${entry.id}/view?usp=sharing`
        });
      }
    }
  }

  return {
    pdfEntries: Array.from(pdfsById.values()),
    visitedFolderCount: visitedFolders.size
  };
}

async function resolveAddedByUserId() {
  const { data: adminProfiles, error: adminError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .eq('role', 'admin')
    .limit(1);

  if (adminError) {
    throw new Error(`Failed to query admin profile: ${adminError.message}`);
  }

  if (adminProfiles && adminProfiles.length > 0) {
    return adminProfiles[0].id;
  }

  const { data: anyProfiles, error: profileError } = await supabaseAdmin
    .from('profiles')
    .select('id')
    .limit(1);

  if (profileError) {
    throw new Error(`Failed to query fallback profile: ${profileError.message}`);
  }

  if (!anyProfiles || anyProfiles.length === 0) {
    throw new Error('No profile records found; cannot set added_by for imported books');
  }

  return anyProfiles[0].id;
}

async function loadExistingBooksByResourceUrls(resourceUrls) {
  if (resourceUrls.length === 0) {
    return new Map();
  }

  const { data, error } = await supabaseAdmin
    .from('library_books')
    .select('id,resource_url')
    .in('resource_url', resourceUrls);

  if (error) {
    throw new Error(`Failed to load existing books: ${error.message}`);
  }

  return new Map((data || []).map((row) => [row.resource_url, row]));
}

async function main() {
  const { folderUrl, dryRun, refreshExisting } = parseArgs(process.argv.slice(2));
  const folderId = extractFolderId(folderUrl);

  console.log(`Folder URL: ${folderUrl}`);
  console.log(`Folder ID: ${folderId}`);

  const { pdfEntries, visitedFolderCount } = await collectPdfEntriesRecursively(folderId);

  if (pdfEntries.length === 0) {
    throw new Error('No PDF entries found in the shared folder HTML');
  }

  const resourceUrls = pdfEntries.map((entry) => entry.fileUrl);
  const existingBooksByResourceUrl = await loadExistingBooksByResourceUrls(resourceUrls);

  const newEntries = pdfEntries.filter((entry) => !existingBooksByResourceUrl.has(entry.fileUrl));
  const existingEntries = pdfEntries.filter((entry) => existingBooksByResourceUrl.has(entry.fileUrl));

  console.log(`Scanned ${visitedFolderCount} folders recursively`);
  console.log(`Found ${pdfEntries.length} PDF files in folder tree`);
  console.log(`Already in library: ${pdfEntries.length - newEntries.length}`);
  console.log(`To import: ${newEntries.length}`);
  console.log(`To refresh existing: ${refreshExisting ? existingEntries.length : 0}`);

  if (newEntries.length === 0 && !refreshExisting) {
    console.log('Nothing to import. Library already has all parsed entries.');
    return;
  }

  const addedByUserId = await resolveAddedByUserId();

  const booksToInsert = newEntries.map((entry) => ({
    ...deriveBookFields(entry.fileName, entry.fileUrl),
    added_by: addedByUserId
  }));

  const booksToRefresh = existingEntries.map((entry) => {
    const existing = existingBooksByResourceUrl.get(entry.fileUrl);
    return {
      id: existing.id,
      ...deriveBookFields(entry.fileName, entry.fileUrl)
    };
  });

  if (dryRun) {
    console.log('Dry run enabled. Sample payload:');
    console.log(JSON.stringify(booksToInsert.slice(0, 5), null, 2));
    if (refreshExisting) {
      console.log('Dry run refresh sample:');
      console.log(JSON.stringify(booksToRefresh.slice(0, 5), null, 2));
    }
    return;
  }

  let insertedCount = 0;
  if (booksToInsert.length > 0) {
    const { data, error } = await supabaseAdmin
      .from('library_books')
      .insert(booksToInsert)
      .select('id,title,resource_url');

    if (error) {
      throw new Error(`Insert failed: ${error.message}`);
    }

    insertedCount = data.length;
  }

  let refreshedCount = 0;
  if (refreshExisting && booksToRefresh.length > 0) {
    for (const book of booksToRefresh) {
      const { id, ...updateData } = book;
      const { error } = await supabaseAdmin
        .from('library_books')
        .update(updateData)
        .eq('id', id);

      if (error) {
        throw new Error(`Refresh failed for ${id}: ${error.message}`);
      }
      refreshedCount += 1;
    }
  }

  console.log(`Imported ${insertedCount} books successfully.`);
  if (refreshExisting) {
    console.log(`Refreshed ${refreshedCount} existing books successfully.`);
  }
}

main().catch((error) => {
  console.error('Import failed:', error.message);
  process.exit(1);
});
