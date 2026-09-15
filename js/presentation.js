/**
 * Reveal.js Presentation Configuration & Bootstrap
 */
import Reveal from '../node_modules/reveal.js/dist/reveal.mjs';
import Markdown from '../node_modules/reveal.js/dist/plugin/markdown.mjs';
import Highlight from '../node_modules/reveal.js/dist/plugin/highlight.mjs';
import Notes from '../node_modules/reveal.js/dist/plugin/notes.mjs';
import Zoom from '../node_modules/reveal.js/dist/plugin/zoom.mjs';
import Search from '../node_modules/reveal.js/dist/plugin/search.mjs';

Reveal.initialize({
	hash: true,
	slideNumber: true,
	controls: true,
	progress: true,
	transition: 'slide',
	width: 1600,
	height: 900,
	margin: 0.02,
	minScale: 0.2,
	maxScale: 2.0,
	plugins: [Markdown, Highlight, Zoom, Notes, Search],
});

export default Reveal;
