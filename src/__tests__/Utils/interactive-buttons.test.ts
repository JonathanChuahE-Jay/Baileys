import { proto } from '../../../WAProto'
import { generateWAMessageContent } from '../../Utils/messages'

const options = {
	upload: async () => {
		throw new Error('Text-only button tests must not upload media')
	}
}

const buttons = [
	{ name: 'cta_copy', buttonParamsJson: JSON.stringify({ display_text: 'Copy code', copy_code: 'TEST-CODE' }) },
	{ name: 'cta_url', buttonParamsJson: JSON.stringify({ display_text: 'Open website', url: 'https://example.com' }) },
	{ name: 'quick_reply', buttonParamsJson: JSON.stringify({ display_text: 'Confirm', id: 'confirm' }) }
]

describe('fork interactive button compatibility', () => {
	it('preserves text and native-flow buttons instead of falling back to a plain text message', async () => {
		const content = await generateWAMessageContent({ text: 'Choose an action', interactiveButtons: buttons }, options)
		expect(content.extendedTextMessage).toBeNull()
		expect(content.interactiveMessage?.body?.text).toBe('Choose an action')
		expect(content.interactiveMessage?.nativeFlowMessage?.buttons).toEqual(buttons)
		expect(content.interactiveMessage?.header?.hasMediaAttachment).toBe(false)
	})

	it('round-trips copy buttons inside the view-once envelope used by the gateway', async () => {
		const content = await generateWAMessageContent(
			{ text: 'Copy your code', interactiveButtons: buttons, viewOnce: true, footer: 'Test footer' },
			options
		)
		const decoded = proto.Message.decode(proto.Message.encode(proto.Message.fromObject(content)).finish())
		const interactive = decoded.viewOnceMessage?.message?.interactiveMessage
		expect(interactive?.body?.text).toBe('Copy your code')
		expect(interactive?.footer?.text).toBe('Test footer')
		expect(interactive?.nativeFlowMessage?.buttons).toHaveLength(3)
		expect(JSON.parse(interactive!.nativeFlowMessage!.buttons![0]!.buttonParamsJson!)).toEqual({
			display_text: 'Copy code',
			copy_code: 'TEST-CODE'
		})
	})

	it('preserves legacy reply buttons and lists when text is supplied', async () => {
		const reply = await generateWAMessageContent(
			{ text: 'Confirm?', buttons: [{ buttonId: 'yes', buttonText: { displayText: 'Yes' } }] },
			options
		)
		expect(reply.buttonsMessage?.contentText).toBe('Confirm?')
		expect(reply.buttonsMessage?.buttons?.[0]?.buttonId).toBe('yes')
		const list = await generateWAMessageContent(
			{
				text: 'Choose',
				buttonText: 'Options',
				sections: [{ title: 'Section', rows: [{ title: 'First', rowId: 'first' }] }]
			},
			options
		)
		expect(list.listMessage?.description).toBe('Choose')
		expect(list.listMessage?.sections?.[0]?.rows?.[0]?.rowId).toBe('first')
	})

	it('leaves ordinary text messages as ordinary text', async () => {
		const content = await generateWAMessageContent({ text: 'Hello' }, options)
		expect(content.extendedTextMessage?.text).toBe('Hello')
		expect(content.interactiveMessage).toBeNull()
		expect(content.viewOnceMessage).toBeNull()
	})
})
