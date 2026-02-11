import { Components } from "@flamework/components"
import { Dependency } from "@flamework/core"
import React, {
	createContext,
	useContext,
	useEffect,
	useState
} from "@rbxts/react"
import { Players } from "@rbxts/services"
import { CartClientComponent } from "client/components/cart.client.component"
import { AnimationController } from "client/controllers/animation.controller"
import { CartController } from "client/controllers/cart.controller"
import { __IS_EDIT__ } from "shared/config.helper"
import { Logger } from "shared/logger"
import { ClientEvents } from "shared/network.helper"

const logger = new Logger("CartContext")

export type CartState = "none" | "alive" | "death_screen" | "reviving"

interface CartContextValue {
	cart: CartClientComponent | undefined
	state: CartState
	spawnPoint: CFrame | undefined
	changeState: (state: CartState) => void
	confirmHardReset: () => void
	products: Map<string, number>
}

const CartContext = createContext<CartContextValue | undefined>(undefined)

export function CartProvider(props: {
	children: React.ReactNode
	__story?: { mock_state: CartState }
}) {
	const [cart, setCart] = useState<CartClientComponent | undefined>()
	const [state, setState] = useState<CartState>("none")
	const [products,setProducts] = useState<Map<string, number>>(new Map())
	const [spawnPoint, setSpawnPoint] = useState<CFrame | undefined>(undefined)
	useEffect(() => {
		if (props.__story?.mock_state === undefined) { return }
		if (props.__story.mock_state === "death_screen") {
			setSpawnPoint(new CFrame())
		}
		changeState(props.__story.mock_state)
	}, [props.__story?.mock_state])
	// Listen for cart changes
	useEffect(() => {
		if (__IS_EDIT__) {
			return
		}

		const components = Dependency<Components>()
		const cart_controller = Dependency<CartController>()

		// Check for existing cart
		const checkCart = () => {
			const all_carts = components.getAllComponents<CartClientComponent>()
			const my_cart = all_carts.find(
				(c) => c.resolvePlayer() === Players.LocalPlayer
			)
			if (my_cart && my_cart !== cart) {
				logger.log(`Found cart: ${my_cart.instance.GetFullName()}`)
				setCart(my_cart)
				changeState("alive")
			} else if (!my_cart && cart) {
				logger.log("Lost cart")
				setCart(undefined)
				changeState("none")
			}
		}

		checkCart()

		// Listen for death screen
		const deathConnection = cart_controller.toggleOnDeathScreen.Connect(
			(spawn_point) => {
				logger.log(`Death screen toggled: ${spawn_point !== undefined}`)
				setSpawnPoint(spawn_point)
				if (spawn_point) {
					changeState("death_screen")
				}
			}
		)

		return () => {
			deathConnection.Disconnect()
		}
	}, [cart])

	// Anchor character when death screen is active
	// useEffect(() => {
	// 	const my_char = Players.LocalPlayer.Character
	// 	if (my_char && my_char.PrimaryPart) {
	// 		my_char.PrimaryPart.Anchored = !!spawnPoint
	// 	}
	// }, [spawnPoint])

	const changeState = (new_state: CartState) => {
		logger.log(`STATE-> ${new_state}`)
		switch (new_state) {
			case "none" :{
				setSpawnPoint(undefined)
				setCart(undefined)
			}
		}
		setState(new_state)
	}
	const confirmHardReset = () => {
		ClientEvents.CheckpointService.processPlayerDeath.fire()
		logger.log("STATE-> RESETING")
		setSpawnPoint(undefined)
		changeState("none")
	}

	const value: CartContextValue = {
		cart,
		state,
		spawnPoint,
		changeState,
		confirmHardReset,
		products
	}
	useEffect(() => {
		if (__IS_EDIT__) {
			return
		}
		ClientEvents.CartService.playerProductsUpdated.connect((data) => {
			logger.log(`Received product update: ${data}`)
			setProducts(data)
		})
		const cart_controller = Dependency<CartController>()
		cart_controller.onCartChange.Connect((new_cart) => {
			const my_card = cart_controller.getMyCart()
			if (my_card) {
				new_cart = my_card
			}
			logger.log(`Cart changed: ${new_cart?.instance.GetFullName()}`)
			setCart(new_cart)
			if (new_cart) {
				changeState("alive")
			} else {
				changeState("none")
			}
		})
	}, [])
	return (
		<CartContext.Provider value={value}>{props.children}</CartContext.Provider>
	)
}

export function useCart() {
	const context = useContext(CartContext)
	if (context === undefined) {
		throw "useCart must be used within a CartProvider"
	}
	return context
}
