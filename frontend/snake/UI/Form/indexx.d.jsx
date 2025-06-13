import { HTMLAttributes, ReactHTMLElement, InputHTMLAttributes, TextareaHTMLAttributes, FormHTMLAttributes } from 'react'

export function Input(props: HTMLAttributes<InputHTMLAttributes>): ReactHTMLElement

export function Textarea(props: HTMLAttributes<TextareaHTMLAttributes>): ReactHTMLElement

export function From(props: HTMLAttributes<FormHTMLAttributes>): ReactHTMLElement

export function Checkbox(props: HTMLAttributes<InputHTMLAttributes>): ReactHTMLElement

export function Radio(props: HTMLAttributes<InputHTMLAttributes>): ReactHTMLElement
