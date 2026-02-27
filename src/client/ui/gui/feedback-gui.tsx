import React, { useState } from "@rbxts/react"
import { useMutation, useQuery } from "@rbxts/react-query"
import { RottenButton } from "@common/client/ui/components/buttons/rotten-button"
import { GoofyText } from "@common/client/ui/components/goofy-text"
import { LoadingIndicator } from "@common/client/ui/components/loading-indicator"
import { PRIMARY, UIDIM } from "@common/client/ui/constants"
import { A } from "@common/shared/assets"
import { ClientFunctions } from "shared/network.helper"
import { __IS_EDIT__ } from "@common/shared/config.builder"

type FeedbackStatus = "pending" | "rejected" | "approved"

interface IFeedbackItem {
	id: number
	user_id: number
	description: string
	status: FeedbackStatus
	response: string | undefined
	responded_at: number | undefined
	deleted_at: number | undefined
	created_at: number
}

const STATUS_COLORS: Record<FeedbackStatus, Color3> = {
	pending: Color3.fromRGB(255, 200, 50),
	approved: Color3.fromRGB(80, 220, 100),
	rejected: Color3.fromRGB(255, 80, 80),
}

const STATUS_LABELS: Record<FeedbackStatus, string> = {
	pending: "Pending",
	approved: "Approved",
	rejected: "Rejected",
}

const FONT = new Font(
	"rbxasset://fonts/families/GothamSSm.json",
	Enum.FontWeight.Heavy,
	Enum.FontStyle.Normal,
)
const FONT_MEDIUM = new Font(
	"rbxasset://fonts/families/GothamSSm.json",
	Enum.FontWeight.Medium,
	Enum.FontStyle.Normal,
)

function FeedbackEntry(props: { item: IFeedbackItem }) {
	const { item } = props
	const statusColor = STATUS_COLORS[item.status]
	const darkStatus = statusColor.Lerp(new Color3(0, 0, 0), 0.5)

	return (
		<frame
			key={`feedback-${item.id}`}
			Size={new UDim2(1, 0, 0, 0)}
			AutomaticSize={Enum.AutomaticSize.Y}
			BackgroundColor3={Color3.fromRGB(0, 28, 50)}
			BackgroundTransparency={0.3}
			BorderSizePixel={0}
			LayoutOrder={item.id}
		>
			<uistroke
				Color={statusColor}
				Thickness={2}
				Transparency={0.6}
			/>
			<uipadding
				PaddingLeft={new UDim(0, 10)}
				PaddingRight={new UDim(0, 10)}
				PaddingTop={new UDim(0, 8)}
				PaddingBottom={new UDim(0, 8)}
			/>
			<uilistlayout
				FillDirection={Enum.FillDirection.Vertical}
				Padding={new UDim(0, 5)}
				SortOrder={Enum.SortOrder.LayoutOrder}
			/>
			{/* Status row */}
			<frame
				Size={new UDim2(1, 0, 0, 20)}
				BackgroundTransparency={1}
				LayoutOrder={1}
			>
				<frame
					Size={new UDim2(0, 72, 1, 0)}
					BackgroundColor3={statusColor}
					AnchorPoint={new Vector2(0, 0.5)}
					Position={new UDim2(0, 0, 0.5, 0)}
					BorderSizePixel={0}
				>
					<textlabel
						Size={UIDIM.ONE}
						BackgroundTransparency={1}
						Text={STATUS_LABELS[item.status]}
						TextColor3={new Color3(1, 1, 1)}
						TextScaled={true}
						FontFace={FONT}
					>
						<uistroke
							Color={darkStatus}
							Thickness={0.08}
							StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
						/>
						<uitextsizeconstraint MaxTextSize={13} MinTextSize={7} />
					</textlabel>
				</frame>
				<textlabel
					Size={new UDim2(1, -82, 1, 0)}
					AnchorPoint={new Vector2(1, 0.5)}
					Position={new UDim2(1, 0, 0.5, 0)}
					BackgroundTransparency={1}
					Text={`#${item.id}`}
					TextColor3={new Color3(0.5, 0.55, 0.65)}
					TextScaled={true}
					TextXAlignment={Enum.TextXAlignment.Right}
					FontFace={FONT_MEDIUM}
				>
					<uitextsizeconstraint MaxTextSize={12} MinTextSize={7} />
				</textlabel>
			</frame>
			{/* Description */}
			<textlabel
				Size={new UDim2(1, 0, 0, 0)}
				AutomaticSize={Enum.AutomaticSize.Y}
				BackgroundTransparency={1}
				Text={item.description}
				TextColor3={new Color3(0.88, 0.9, 0.95)}
				TextScaled={false}
				TextSize={15}
				TextWrapped={true}
				TextXAlignment={Enum.TextXAlignment.Left}
				FontFace={FONT_MEDIUM}
				LayoutOrder={2}
			/>
			{/* Dev response */}
			{item.response !== undefined && item.response !== "" ? (
				<frame
					Size={new UDim2(1, 0, 0, 0)}
					AutomaticSize={Enum.AutomaticSize.Y}
					BackgroundColor3={Color3.fromRGB(0, 40, 20)}
					BackgroundTransparency={0.4}
					BorderSizePixel={0}
					LayoutOrder={3}
				>
					<uistroke
						Color={Color3.fromRGB(80, 220, 100)}
						Thickness={1}
						Transparency={0.6}
					/>
					<uipadding
						PaddingLeft={new UDim(0, 8)}
						PaddingRight={new UDim(0, 8)}
						PaddingTop={new UDim(0, 5)}
						PaddingBottom={new UDim(0, 5)}
					/>
					<uilistlayout
						FillDirection={Enum.FillDirection.Vertical}
						Padding={new UDim(0, 3)}
						SortOrder={Enum.SortOrder.LayoutOrder}
					/>
					<textlabel
						Size={new UDim2(1, 0, 0, 14)}
						BackgroundTransparency={1}
						Text="Dev Response:"
						TextColor3={Color3.fromRGB(80, 220, 100)}
						TextScaled={false}
						TextSize={11}
						TextXAlignment={Enum.TextXAlignment.Left}
						FontFace={FONT}
						LayoutOrder={1}
					/>
					<textlabel
						Size={new UDim2(1, 0, 0, 0)}
						AutomaticSize={Enum.AutomaticSize.Y}
						BackgroundTransparency={1}
						Text={item.response}
						TextColor3={new Color3(0.82, 0.94, 0.82)}
						TextScaled={false}
						TextSize={14}
						TextWrapped={true}
						TextXAlignment={Enum.TextXAlignment.Left}
						FontFace={FONT_MEDIUM}
						LayoutOrder={2}
					/>
				</frame>
			) : undefined}
		</frame>
	)
}

function FeedbackList(props: { feedbacks: IFeedbackItem[] }) {
	if (props.feedbacks.size() === 0) {
		return (
			<frame Size={new UDim2(1, 0, 0, 80)} BackgroundTransparency={1}>
				<GoofyText
					Text={"No feedback submitted yet!"}
					Size={UIDIM.ONE}
					AnchorPoint={UIDIM.A_CENTER}
					Position={UIDIM.CENTER}
					TextColor3={new Color3(0.5, 0.6, 0.7)}
					MaxTextSize={16}
					MinTextSize={10}
					Thickness={0.05}
				/>
			</frame>
		)
	}

	return (
		<>
			{props.feedbacks.map((item) => (
				<FeedbackEntry key={`entry-${item.id}`} item={item} />
			))}
		</>
	)
}

export function FeedbackGui() {
	const [view, setView] = useState<"list" | "create">("list")
	const [inputText, setInputText] = useState("")

	const {
		data: feedbacks,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: ["feedbacks"],
		queryFn: async () => {
			if (__IS_EDIT__) return [] as IFeedbackItem[]
			const result = await ClientFunctions.FeedbackService.getMyFeedbacks()
			if (!result[0]) throw result[1]
			return result[0] as IFeedbackItem[]
		},
	})

	const { mutate: submitFeedback, isLoading: isSubmitting } = useMutation({
		queryKey: "submitFeedback",
		mutationFn: async (description: string) => {
			if (__IS_EDIT__) return undefined as unknown as IFeedbackItem
			const result = await ClientFunctions.FeedbackService.submitFeedback(description)
			if (!result[0]) throw result[1]
			return result[0] as IFeedbackItem
		},
		onSuccess: () => {
			setView("list")
			setInputText("")
			refetch()
		},
	})

	const pendingCount = (feedbacks ?? []).filter((f) => f.status === "pending").size()
	const atPendingLimit = pendingCount >= 10
	const canSubmit = inputText.size() >= 10 && inputText.size() <= 1000 && !atPendingLimit

	return (
		<frame
			Size={UIDIM.ONE}
			AnchorPoint={UIDIM.A_CENTER}
			Position={UIDIM.CENTER}
			BackgroundColor3={Color3.fromRGB(0, 36, 62)}
			BorderSizePixel={0}
			ClipsDescendants={true}
		>
			<uigradient
				Rotation={90}
				Transparency={new NumberSequence([
					new NumberSequenceKeypoint(0, 0.5, 0),
					new NumberSequenceKeypoint(1, 0.2, 0),
				])}
			/>
			<uistroke
				StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
				Thickness={0.01}
			/>

			{/* Tile overlay */}
			<imagelabel
				Size={UIDIM.ONE}
				AnchorPoint={UIDIM.A_CENTER}
				Position={UIDIM.CENTER}
				ScaleType={Enum.ScaleType.Tile}
				TileSize={new UDim2(0, 50, 0, 50)}
				Image={A.ui.tile}
				ImageTransparency={0.88}
				BackgroundTransparency={1}
				ZIndex={0}
			/>

			{/* Tab bar */}
			<frame
				Size={new UDim2(1, 0, 0.13, 0)}
				Position={UIDIM.TOP_LEFT}
				BackgroundColor3={Color3.fromRGB(255, 255, 255)}
				BorderSizePixel={0}
				ZIndex={2}
			>
				<uistroke
					StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
					Thickness={0.01}
				/>
				<uigradient
					Color={new ColorSequence([
						new ColorSequenceKeypoint(0, Color3.fromRGB(0, 128, 255)),
						new ColorSequenceKeypoint(1, Color3.fromRGB(148, 215, 248)),
					])}
					Rotation={-90}
				/>
				{/* Bottom shadow strip */}
				<frame
					Size={new UDim2(1, 0, 0.08, 0)}
					AnchorPoint={new Vector2(0, 1)}
					Position={new UDim2(0, 0, 1, 0)}
					BackgroundColor3={new Color3(0, 0, 0)}
					BackgroundTransparency={0.4}
					BorderSizePixel={0}
					ZIndex={3}
				/>
				{/* Tile overlay on header */}
				<imagelabel
					AnchorPoint={new Vector2(0.5, 0.5)}
					BackgroundTransparency={1}
					Image={A.ui.tile}
					ImageTransparency={0.75}
					Position={new UDim2(0.5, 0, 0.46, 0)}
					ScaleType={Enum.ScaleType.Tile}
					Size={new UDim2(1, 0, 0.921, 0)}
					TileSize={new UDim2(0, 50, 0, 50)}
					ZIndex={0}
				/>
				{/* Tab buttons container */}
				<frame
					Size={new UDim2(0.6, 0, 0.6, 0)}
					AnchorPoint={UIDIM.A_CENTER}
					Position={UIDIM.CENTER}
					BackgroundTransparency={1}
					ZIndex={3}
				>
					<uilistlayout
						FillDirection={Enum.FillDirection.Horizontal}
						HorizontalAlignment={Enum.HorizontalAlignment.Center}
						VerticalAlignment={Enum.VerticalAlignment.Center}
						Padding={new UDim(0.08, 0)}
						SortOrder={Enum.SortOrder.LayoutOrder}
					/>
					<RottenButton
						Text="List"
						onClick={() => setView("list")}
						Color={new Color3(0.15, 0.55, 1)}
						Size={new UDim2(0.45, 0, 1, 0)}
						LayoutOrder={1}
					>
						{view === "list" ? (
							<uistroke
								Color={new Color3(1, 1, 1)}
								Thickness={0.08}
								StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
								Transparency={0}
								ZIndex={10}
							/>
						) : undefined}
					</RottenButton>
					<RottenButton
						Text="New"
						onClick={() => setView("create")}
						Color={Color3.fromRGB(60, 185, 90)}
						Size={new UDim2(0.45, 0, 1, 0)}
						LayoutOrder={2}
					>
						{view === "create" ? (
							<uistroke
								Color={new Color3(1, 1, 1)}
								Thickness={.08}
								StrokeSizingMode={Enum.StrokeSizingMode.ScaledSize}
								Transparency={0}
								ZIndex={10}
							/>
						) : undefined}
					</RottenButton>
				</frame>
			</frame>

			{/* Content area */}
			<frame
				Size={new UDim2(1, 0, 0.87, 0)}
				Position={new UDim2(0, 0, 0.13, 0)}
				BackgroundTransparency={1}
				ZIndex={1}
			>
				{view === "list" ? (
					isLoading ? (
						<LoadingIndicator />
					) : (
						<scrollingframe
							Active={true}
							Size={UIDIM.ONE}
							BackgroundTransparency={1}
							CanvasSize={new UDim2(0, 0, 0, 0)}
							AutomaticCanvasSize={Enum.AutomaticSize.Y}
							ScrollBarThickness={4}
							ScrollBarImageColor3={PRIMARY}
							ScrollBarImageTransparency={0.5}
							ScrollingDirection={Enum.ScrollingDirection.Y}
							BorderSizePixel={0}
						>
							<uilistlayout
								FillDirection={Enum.FillDirection.Vertical}
								Padding={new UDim(0, 8)}
								SortOrder={Enum.SortOrder.LayoutOrder}
								HorizontalAlignment={Enum.HorizontalAlignment.Center}
							/>
							<uipadding
								PaddingLeft={new UDim(0.04, 0)}
								PaddingRight={new UDim(0.04, 0)}
								PaddingTop={new UDim(0.03, 0)}
								PaddingBottom={new UDim(0.03, 0)}
							/>
							<FeedbackList feedbacks={feedbacks ?? []} />
						</scrollingframe>
					)
				) : (
					<frame Size={UIDIM.ONE} BackgroundTransparency={1}>
						<uipadding
							PaddingLeft={new UDim(0.05, 0)}
							PaddingRight={new UDim(0.05, 0)}
							PaddingTop={new UDim(0.04, 0)}
							PaddingBottom={new UDim(0.04, 0)}
						/>
						<uilistlayout
							FillDirection={Enum.FillDirection.Vertical}
							Padding={new UDim(0.025, 0)}
							SortOrder={Enum.SortOrder.LayoutOrder}
							HorizontalAlignment={Enum.HorizontalAlignment.Center}
						/>

						{/* Hint */}
						<textlabel
							Size={new UDim2(1, 0, 0.09, 0)}
							BackgroundTransparency={1}
							Text={
								atPendingLimit
									? `You have ${pendingCount}/10 pending feedbacks. Wait for review before submitting more.`
									: "Share a bug, suggestion, or anything on your mind!"
							}
							TextColor3={atPendingLimit ? Color3.fromRGB(255, 110, 80) : new Color3(0.65, 0.75, 0.88)}
							TextScaled={false}
							TextSize={16}
							TextWrapped={true}
							TextXAlignment={Enum.TextXAlignment.Left}
							FontFace={new Font(
								"rbxasset://fonts/families/GothamSSm.json",
								Enum.FontWeight.Medium,
								Enum.FontStyle.Italic,
							)}
							LayoutOrder={1}
						/>

						{/* Text input */}
						<frame
							Size={new UDim2(1, 0, 0.56, 0)}
							BackgroundColor3={Color3.fromRGB(0, 22, 42)}
							BackgroundTransparency={0.2}
							BorderSizePixel={0}
							LayoutOrder={2}
						>
							<uistroke
								Color={PRIMARY}
								Thickness={1.5}
								Transparency={0.55}
							/>
							<uipadding
								PaddingLeft={new UDim(0, 10)}
								PaddingRight={new UDim(0, 10)}
								PaddingTop={new UDim(0, 8)}
								PaddingBottom={new UDim(0, 8)}
							/>
							<textbox
								Size={UIDIM.ONE}
								BackgroundTransparency={1}
								Text={inputText}
								PlaceholderText="Describe your feedback here... (10–1000 chars)"
								PlaceholderColor3={new Color3(0.35, 0.45, 0.58)}
								TextColor3={new Color3(0.9, 0.93, 1)}
								TextScaled={false}
								TextSize={20}
								TextWrapped={true}
								TextXAlignment={Enum.TextXAlignment.Left}
								TextYAlignment={Enum.TextYAlignment.Top}
								MultiLine={true}
								FontFace={FONT_MEDIUM}
								ClearTextOnFocus={false}
								Change={{
									Text: (tb: TextBox) => setInputText(tb.Text),
								}}
							/>
						</frame>

						{/* Char count */}
						<textlabel
							Size={new UDim2(1, 0, 0.06, 0)}
							BackgroundTransparency={1}
							Text={`${inputText.size()} / 1000`}
							TextColor3={
								inputText.size() < 10
									? Color3.fromRGB(255, 100, 80)
									: inputText.size() > 900
									? Color3.fromRGB(255, 200, 50)
									: Color3.fromRGB(80, 210, 110)
							}
							TextScaled={false}
							TextSize={14}
							TextXAlignment={Enum.TextXAlignment.Right}
							FontFace={FONT_MEDIUM}
							LayoutOrder={3}
						/>

						{/* Submit */}
						<RottenButton
							Text={isSubmitting ? "Submitting..." : "Submit"}
							onClick={() => {
								if (canSubmit && !isSubmitting) {
									submitFeedback(inputText)
								}
							}}
							Color={
								canSubmit && !isSubmitting
									? Color3.fromRGB(60, 185, 90)
									: Color3.fromRGB(50, 60, 75)
							}
							Size={new UDim2(0.7, 0, 0.11, 0)}
							Ratio={3.5}
							LayoutOrder={4}
						/>
					</frame>
				)}
			</frame>
		</frame>
	)
}
