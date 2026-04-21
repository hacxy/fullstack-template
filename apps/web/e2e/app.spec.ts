import { expect, test } from './fixtures'

test('homepage renders correctly', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: 'Get started' })).toBeVisible()
})

test('counter increments on click', async ({ page }) => {
  await page.goto('/')
  const button = page.getByRole('button', { name: /Count is/ })
  await expect(button).toContainText('Count is 0')
  await button.click()
  await expect(button).toContainText('Count is 1')
})
