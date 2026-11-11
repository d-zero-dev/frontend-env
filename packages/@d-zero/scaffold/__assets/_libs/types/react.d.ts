// `@types/react`にない、Invoker Commands API の属性: `<button command="show-modal" commandfor="id">`
import 'react';

declare module 'react' {
	// oxlint-disable-next-line no-unused-vars
	interface ButtonHTMLAttributes<T> {
		command?: string | undefined;
		commandfor?: string | undefined;
	}
}
