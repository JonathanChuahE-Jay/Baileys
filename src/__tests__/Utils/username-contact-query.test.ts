import { USyncQuery, USyncUser } from '../../WAUSync'
import { USyncContactProtocol } from '../../WAUSync/Protocols/USyncContactProtocol'

describe('username contact lookup protocol', () => {
	it('serializes a username and optional key as a contact query', () => {
		const protocol = new USyncContactProtocol()
		expect(protocol.getUserElement(new USyncUser().withUsername('example.user'))).toEqual({
			tag: 'contact',
			attrs: { username: 'example.user' }
		})
		expect(protocol.getUserElement(new USyncUser().withUsername('example.user').withUsernameKey('1234'))).toEqual({
			tag: 'contact',
			attrs: { username: 'example.user', pin: '1234' }
		})
	})

	it('returns the server-provided contact JID for a registered username match', () => {
		const query = new USyncQuery().withContactProtocol().withUser(new USyncUser().withUsername('example.user'))
		const result = query.parseUSyncQueryResult({
			tag: 'iq',
			attrs: { type: 'result' },
			content: [
				{
					tag: 'usync',
					attrs: {},
					content: [
						{
							tag: 'list',
							attrs: {},
							content: [
								{
									tag: 'user',
									attrs: { jid: '123456789@lid' },
									content: [{ tag: 'contact', attrs: { type: 'in' } }]
								}
							]
						}
					]
				}
			]
		})
		expect(result?.list).toEqual([{ id: '123456789@lid', contact: true }])
	})
})
