import { expect, test } from './fixtures'

const API_USERS = 'http://localhost:3000/api/users/'

test('homepage renders correctly', async ({ page }) => {
  await page.route(API_USERS, route => route.fulfill({ json: [] }))
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Users' })).toBeVisible()
  await expect(page.getByPlaceholder('User name')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Add user' })).toBeVisible()
})

test('add user button is disabled when input is empty', async ({ page }) => {
  await page.route(API_USERS, route => route.fulfill({ json: [] }))
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'Add user' })).toBeDisabled()
  await page.getByPlaceholder('User name').fill('Alice')
  await expect(page.getByRole('button', { name: 'Add user' })).toBeEnabled()
})

test('displays users fetched from API', async ({ page }) => {
  await page.route(API_USERS, route =>
    route.fulfill({
      json: [
        { id: 1, name: 'Alice' },
        { id: 2, name: 'Bob' },
      ],
    }))
  await page.goto('/')
  await expect(page.getByText('Alice')).toBeVisible()
  await expect(page.getByText('Bob')).toBeVisible()
  await expect(page.getByText('#1')).toBeVisible()
  await expect(page.getByText('#2')).toBeVisible()
})

test('shows empty state when no users', async ({ page }) => {
  await page.route(API_USERS, route => route.fulfill({ json: [] }))
  await page.goto('/')
  await expect(page.getByText('No users yet. Add one above.')).toBeVisible()
})

test('can add a user', async ({ page }) => {
  const existing = [{ id: 1, name: 'Alice' }]
  await page.route(API_USERS, (route) => {
    if (route.request().method() === 'GET')
      return route.fulfill({ json: existing })
    return route.fulfill({ json: { id: 2, name: 'Bob' } })
  })
  await page.goto('/')
  await page.getByPlaceholder('User name').fill('Bob')
  await page.getByRole('button', { name: 'Add user' }).click()
  await expect(page.getByText('Bob')).toBeVisible()
})
