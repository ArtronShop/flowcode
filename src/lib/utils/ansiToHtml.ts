/** ANSI SGR color codes → CSS color values */
const ANSI_FG: Record<number, string> = {
	30: '#1a1a1a',   // black
	31: '#cc3333',   // red
	32: '#4e9a06',   // green
	33: '#c4a000',   // yellow
	34: '#5b8dd9',   // blue
	35: '#75507b',   // magenta
	36: '#06989a',   // cyan
	37: '#d3d7cf',   // white
	90: '#888a85',   // bright black (gray)
	91: '#ef2929',   // bright red
	92: '#8ae234',   // bright green
	93: '#fce94f',   // bright yellow
	94: '#729fcf',   // bright blue
	95: '#ad7fa8',   // bright magenta
	96: '#34e2e2',   // bright cyan
	97: '#eeeeec',   // bright white
};

function escapeHtml(s: string): string {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;');
}

/**
 * Convert a string containing ANSI SGR escape sequences into HTML
 * with <span style="..."> for colors and bold.
 */
export function ansiToHtml(text: string): string {
	const ANSI_RE = /\x1b\[([0-9;]*)m/g;

	let result = '';
	let lastIndex = 0;
	let currentColor: string | null = null;
	let isBold = false;
	let spanOpen = false;

	const closeSpan = () => {
		if (spanOpen) {
			result += '</span>';
			spanOpen = false;
		}
	};

	const openSpan = () => {
		const styles: string[] = [];
		if (currentColor) styles.push(`color:${currentColor}`);
		if (isBold) styles.push('font-weight:bold');
		if (styles.length > 0) {
			result += `<span style="${styles.join(';')}">`;
			spanOpen = true;
		}
	};

	let match: RegExpExecArray | null;
	while ((match = ANSI_RE.exec(text)) !== null) {
		// Flush text before this escape
		if (match.index > lastIndex) {
			result += escapeHtml(text.slice(lastIndex, match.index));
		}
		lastIndex = match.index + match[0].length;

		const codes = match[1] === '' ? [0] : match[1].split(';').map(Number);

		// Always close before applying new state
		closeSpan();

		// Apply codes to state
		for (const code of codes) {
			if (code === 0) {
				// Reset all
				currentColor = null;
				isBold = false;
			} else if (code === 1) {
				isBold = true;
			} else if (code === 22) {
				isBold = false;
			} else if (ANSI_FG[code] !== undefined) {
				currentColor = ANSI_FG[code];
			}
			// Background colors (40-47, 100-107) are ignored intentionally
		}

		openSpan();
	}

	// Remaining text
	if (lastIndex < text.length) {
		result += escapeHtml(text.slice(lastIndex));
	}

	closeSpan();

	return result;
}
