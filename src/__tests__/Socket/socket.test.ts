import { readFileSync } from 'node:fs'
import { join } from 'node:path'

// Guard the login wire contract without opening a real WhatsApp session.
describe('companion activation on login', () => {
	it('activates delivery independently of markOnlineOnConnect', () => {
		const source = readFileSync(join(process.cwd(), 'src/Socket/socket.ts'), 'utf8')
		const login = source.slice(source.indexOf("ws.on('CB:success'"), source.indexOf("logger.info('opened connection to WA')"))
		expect(login).toContain("await sendPassiveIq('active')")
		expect(login).not.toContain('markOnlineOnConnect')
		expect(login).not.toContain("sendPassiveIq('passive')")
	})
})
