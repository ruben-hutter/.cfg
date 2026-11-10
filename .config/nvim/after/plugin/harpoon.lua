local harpoon = require("harpoon")

-- REQUIRED
harpoon:setup()
-- REQUIRED

vim.keymap.set("n", "<leader>a", function() harpoon:list():add() end, { desc = 'Harpoon: add file' })
vim.keymap.set("n", "<A-e>", function() harpoon.ui:toggle_quick_menu(harpoon:list()) end, { desc = 'Harpoon: toggle quick menu' })

vim.keymap.set("n", "<A-h>", function() harpoon:list():select(1) end, { desc = 'Harpoon: file 1' })
vim.keymap.set("n", "<A-j>", function() harpoon:list():select(2) end, { desc = 'Harpoon: file 2' })
vim.keymap.set("n", "<A-k>", function() harpoon:list():select(3) end, { desc = 'Harpoon: file 3' })
vim.keymap.set("n", "<A-l>", function() harpoon:list():select(4) end, { desc = 'Harpoon: file 4' })
