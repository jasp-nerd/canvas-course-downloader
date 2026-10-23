import { mount } from 'svelte';
import '../../ui/fonts.css';
import '../../ui/theme.css';
import './page.css';
import App from './App.svelte';

const params = new URLSearchParams(location.search);
mount(App, {
  target: document.getElementById('app')!,
  props: {
    origin: params.get('origin') ?? '',
    courseIds: (params.get('courses') ?? '').split(',').filter(Boolean),
    onlyNew: params.get('new') === '1',
    quiet: params.get('quiet') === '1',
  },
});
