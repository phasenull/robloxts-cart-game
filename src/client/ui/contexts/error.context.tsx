import { createContext, useContext, useState } from "@rbxts/react"
import React from "@rbxts/react"
import { useNavigator } from "../hooks/useNavigator"
export const ErrorContext = createContext<
	| {
			err: ErrorInterface | undefined
			setError: (error: ErrorInterface | undefined) => void
	  }
	| undefined
>(undefined)
interface ErrorInterface {
	title: string
	message: string
	retry?: () => Promise<void>
	onClose: () => void
}
export function ErrorProvider(props: { children: any }) {
	const [err, setError] = useState<ErrorInterface | undefined>(undefined)
	function onClose(err:ErrorInterface) {
		err?.onClose()
		setError(undefined)
	}
	function setErrorProxy(err: ErrorInterface | undefined) {
		setError(
			err && {
				...err,
				onClose: ()=>onClose(err)
			}
		)
	}
	return (
		<ErrorContext.Provider value={{ err: err, setError: setErrorProxy }}>
			{props.children}
		</ErrorContext.Provider>
	)
}
export function useErrorPage() {
	const context = useContext(ErrorContext)
	return {
		showError: (err: ErrorInterface) => {
			if (!context) return
			context.setError(err)
			// error(err.title + ": " + err.message)
		},
		err: context?.err,
		clearErrors: () => {
			if (!context) return
			context.setError(undefined)
		}
	}
}
