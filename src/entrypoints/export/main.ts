import { mount } from 'svelte';
import App from './App.svelte';

const params = new URLSearchParams(location.search);
mount(App, {
  target: document.getElementById('app')!,
  props: {
    origin: params.get('origin') ?? '',
    courseIds: (params.get('courses') ?? '').split(',').filter(Boolean),
    onlyNew: params.get('new') === '1',
  },
});
