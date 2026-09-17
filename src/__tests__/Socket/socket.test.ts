import { passiveIqTagFor } from '../../Socket/socket'

describe('passiveIqTagFor', () => {
	it('reports active when the client asked to be marked online', () => {
		expect(passiveIqTagFor(true)).toBe('active')
	})

	it('reports passive when the client opted out of being marked online', () => {
		// Reporting 'active' here makes WA route notifications to this companion and
		// stop pushing them to the user's phone.
		expect(passiveIqTagFor(false)).toBe('passive')
	})
})
