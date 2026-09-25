-- LSP keymaps + completion
-- (server installation/enabling lives in lua/buba/plugins/lsp.lua)

vim.api.nvim_create_autocmd('LspAttach', {
	callback = function(event)
		local opts = { buffer = event.buf, remap = false }

		vim.keymap.set('n', 'gd', function() vim.lsp.buf.definition() end, opts)
		vim.keymap.set('n', 'K', function() vim.lsp.buf.hover() end, opts)
		vim.keymap.set('n', '<leader>vws', function() vim.lsp.buf.workspace_symbol() end, opts, { desc = 'Workspace symbols' })
		vim.keymap.set('n', '<leader>vd', function() vim.diagnostic.open_float() end, opts, { desc = 'Diagnostic float' })
		vim.keymap.set('n', '[d', function() vim.diagnostic.jump({ count = 1, float = true }) end, opts, { desc = 'Next diagnostic' })
		vim.keymap.set('n', ']d', function() vim.diagnostic.jump({ count = -1, float = true }) end, opts, { desc = 'Prev diagnostic' })
		vim.keymap.set('n', '<leader>vca', function() vim.lsp.buf.code_action() end, opts, { desc = 'Code action' })
		vim.keymap.set('n', '<leader>vrr', function() vim.lsp.buf.references() end, opts, { desc = 'References' })
		vim.keymap.set('n', '<leader>vrn', function() vim.lsp.buf.rename() end, opts, { desc = 'Rename' })
		vim.keymap.set('i', '<C-h>', function() vim.lsp.buf.signature_help() end, opts, { desc = 'Signature help' })
	end,
})

-- Set up completion
local cmp = require('cmp')
local cmp_select = { behavior = cmp.SelectBehavior.Select }

cmp.setup({
	sources = {
		{ name = 'path' },
		{ name = 'nvim_lsp' },
	},
	mapping = cmp.mapping.preset.insert({
		['<C-p>'] = cmp.mapping.select_prev_item(cmp_select),
		['<C-n>'] = cmp.mapping.select_next_item(cmp_select),
		['<C-y>'] = cmp.mapping.confirm({ select = true }),
		['<C-Space>'] = cmp.mapping.complete(),
	}),
})
