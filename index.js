const fs = require('fs');
const path = require('path');

const CONNECTIONS_ENDPOINT = 'https://www.nytimes.com/svc/connections/v2';
const BOARD_SIZE = 16;
const ROW_LENGTH = 4;

function parseArguments() {
  const args = process.argv.slice(2);
  let dateArg;
  let includeAnswers = false;

  for (const arg of args) {
    if (arg === '--include-answers') {
      includeAnswers = true;
      continue;
    }

    if (!dateArg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) {
      dateArg = arg;
      continue;
    }

    console.error('Usage: node index.js [YYYY-MM-DD] [--include-answers]');
    process.exit(1);
  }

  const date = dateArg ?? new Date().toISOString().split('T')[0];
  return { date, includeAnswers };
}

async function fetchPuzzle(date) {
  const response = await fetch(`${CONNECTIONS_ENDPOINT}/${date}.json`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; connections-scraper/1.0)',
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch puzzle for ${date}: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

function buildBoard(categories) {
  const board = Array(BOARD_SIZE).fill(null);

  for (const category of categories) {
    for (const card of category.cards) {
      const { position, content } = card;

      if (typeof position !== 'number' || position < 0 || position >= BOARD_SIZE) {
        throw new Error(`Encountered invalid card position: ${JSON.stringify(card)}`);
      }

      board[position] = content;
    }
  }

  if (board.some((cell) => cell === null)) {
    throw new Error('Puzzle data is missing one or more card positions.');
  }

  const rows = [];
  for (let i = 0; i < BOARD_SIZE; i += ROW_LENGTH) {
    rows.push(board.slice(i, i + ROW_LENGTH));
  }

  return rows;
}

function formatCategories(categories) {
  return categories.map((category) => ({
    title: category.title,
    members: category.cards.map((card) => card.content),
  }));
}

async function main() {
  const { date, includeAnswers } = parseArguments();

  try {
    const puzzle = await fetchPuzzle(date);
    const rows = buildBoard(puzzle.categories);

    const outputDir = path.join(__dirname, 'data');
    fs.mkdirSync(outputDir, { recursive: true });

    const boardPath = path.join(outputDir, `${date}.json`);
    fs.writeFileSync(boardPath, JSON.stringify(rows, null, 2));
    console.log(`Saved board to ${boardPath}`);

    if (includeAnswers) {
      const answersPath = path.join(outputDir, `${date}.answers.json`);
      const payload = {
        id: puzzle.id ?? null,
        print_date: puzzle.print_date ?? date,
        editor: puzzle.editor ?? null,
        categories: formatCategories(puzzle.categories),
      };
      fs.writeFileSync(answersPath, JSON.stringify(payload, null, 2));
      console.log(`Saved answers to ${answersPath}`);
    }
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}

main();
