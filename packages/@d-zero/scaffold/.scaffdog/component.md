---
name: 'component'
root: '__assets/_libs'
output: '.'
ignore: []
questions:
  name: 'コンポーネント名を入力してください（例: button, modal など）'
---

# `component/c-{{ inputs.name }}.css`

```css
.c-{{ inputs.name }} {
	/* コンポーネントルートのスタイル */
}

.c-{{ inputs.name }}__element {
	/* 要素のスタイル */
}

```

---

# `component/c-{{ inputs.name }}.pug`

```pug
.c-{{ inputs.name }} c-{{ inputs.name }}

```
