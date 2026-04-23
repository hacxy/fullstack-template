import { expect, test } from './fixtures'

const API_USERS = 'http://localhost:3000/api/users/'
const successResponse = <T>(data: T) => ({ code: 0, msg: 'ok', data })

test('homepage renders correctly', async ({ page }) => {
  await page.route(API_USERS, route => route.fulfill({ json: successResponse([]) }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  await expect(page.getByPlaceholder('User name')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add user' })).toBeVisible()
})

test('add user button is disabled when input is empty', async ({ page }) => {
  await page.route(API_USERS, route => route.fulfill({ json: successResponse([]) }))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Add user' })).toBeDisabled()
  await page.getByPlaceholder('User name').fill('Alice')
  await expect(page.getByRole('button', { name: 'Add user' })).toBeEnabled()
})

test('displays users fetched from API', async ({ page }) => {
  await page.route(API_USERS, route =>
    route.fulfill({
      json: successResponse([
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ]),
    }))
  await page.goto('/')
  await expect(page.getByText('Alice')).toBeVisible()
  await expect(page.getByText('Bob')).toBeVisible()
  await expect(page.getByText('#1')).toBeVisible()
  await expect(page.getByText('#2')).toBeVisible()
})

test('shows empty state when no users', async ({ page }) => {
  await page.route(API_USERS, route => route.fulfill({ json: successResponse([]) }))
  await page.goto('/')
  await expect(page.getByText('No users yet. Add one above.')).toBeVisible()
})

test('can add a user', async ({ page }) => {
  const existing = [{ id: 1, name: 'Alice' }]
  await page.route(API_USERS, (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ json: successResponse(existing) })
    return route.fulfill({ json: successResponse({ id: 2, name: 'Bob' }) })
  })
  await page.goto('/')
  await page.getByPlaceholder('User name').fill('Bob')
  await page.getByRole('button', { name: 'Add user' }).click()
  await expect(page.getByText('Bob')).toBeVisible()
})

test('shows loading state while fetching users', async ({ page }) => {
  await page.route(API_USERS, (route) => {
    setTimeout(() => {
      route.fulfill({ json: successResponse([]) })
    }, 400)
  })

  await page.goto('/')
  await expect(page.getByText('Loading...')).toBeVisible()
  await expect(page.getByText('No users yet. Add one above.')).toBeVisible()
})

test('adds user with trimmed name and clears input', async ({ page }) => {
  const existing = [{ id: 1, name: 'Alice' }]
  let postedName = ''

  await page.route(API_USERS, (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ json: successResponse(existing) })

    const payload = route.request().postDataJSON() as { name: string }
    postedName = payload.name
    return route.fulfill({ json: successResponse({ id: 2, name: payload.name }) })
  })

  await page.goto('/')
  const input = page.getByPlaceholder('User name')
  await input.fill('  Bob  ')
  await page.getByRole('button', { name: 'Add user' }).click()

  await expect.poll(() => postedName).toBe('Bob')
  await expect(input).toHaveValue('')
  await expect(page.getByText('Bob')).toBeVisible()
})
