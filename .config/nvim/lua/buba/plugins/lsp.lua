return {
	{'williamboman/mason.nvim', opts = {}},
	{'williamboman/mason-lspconfig.nvim', opts = {
		-- we enable servers explicitly in nvim-lspconfig's config below
		automatic_enable = false,
		ensure_installed = {
			-- ghcup's GHC; HLS is installed via ghcup instead
			'bashls',        -- bash
			'pyright',       -- python
			'rust_analyzer', -- rust
			'clangd',        -- c / c++
			'gopls',         -- go
			'lua_ls',        -- lua
			'ts_ls',         -- javascript / typescript
			'html',          -- html
			'cssls',         -- css
			'tinymist',      -- typst (was configured before)
			'nil_ls',        -- nix
		},
	}},

	{
		'neovim/nvim-lspconfig',
		config = function()
			-- nvim-cmp completion capabilities for every server
			vim.lsp.config('*', {
				capabilities = require('cmp_nvim_lsp').default_capabilities(),
			})

			-- ghcup's HLS is ABI-matched with ghcup's GHC (mason's HLS is NOT -
			-- different bindists). Use the versioned binary directly: the wrapper
			-- would resolve haskell-language-server-9.10.3 from PATH, where
			-- mason's incompatible one shadows ghcup's inside nvim.
			vim.lsp.config('hls', {
				cmd = { vim.fn.expand('~/.ghcup/bin/haskell-language-server-9.10.3'), '--lsp' },
				-- formattingProvider needs the formatter binary on PATH
				-- (~/.local/bin/fourmolu). Project-level fourmolu.yaml overrides style.
				settings = {
					haskell = { formattingProvider = 'fourmolu' },
				},
			})

			-- make lua_ls aware of the `vim` global
			vim.lsp.config('lua_ls', {
				settings = {
					Lua = { diagnostics = { globals = { 'vim' } } },
				},
			})

			-- dartls: dart comes from the nix flake on PATH inside LiveTogether
			-- (direnv `use flake`), NOT from mason — mason's dart packaging is
			-- unreliable. lspconfig's dartls resolves `dart` from PATH.
			-- jdtls is configured by nvim-java; enabled here
			-- (keymaps live in after/plugin/lsp.lua)
			vim.lsp.enable({
				'hls', 'jdtls', 'bashls', 'pyright', 'rust_analyzer',
				'clangd', 'gopls', 'lua_ls', 'ts_ls', 'html', 'cssls',
				'tinymist', 'fish_lsp', 'nil_ls', 'dartls',
			})
		end,
	},
	{'hrsh7th/cmp-nvim-lsp'},
	{'hrsh7th/nvim-cmp'}
}
