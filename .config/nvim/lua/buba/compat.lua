-- Compatibility shims for plugins still calling removed/deprecated nvim APIs.
-- Loaded first (before lazy + plugins), so plugins can keep calling the old
-- names; the implementations are the documented replacements.

-- vim.tbl_flatten: deprecated (0.11+, warns on every call — e.g. norcalli's
-- archived nvim-colorizer.lua calls it in setup on every startup) and slated
-- for removal. Replaced by the identical vim.iter implementation.
if vim.tbl_flatten then
  vim.tbl_flatten = function(t)
    return vim.iter(t):flatten():totable()
  end
end
