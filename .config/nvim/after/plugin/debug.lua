local dap, dapui = require("dap"), require("dapui")

local debugpy = vim.fn.expand('~/.venv/debugpy/bin/python')
local python_for_dap = vim.fn.executable(debugpy) == 1 and debugpy or 'python3'

-- Language specific configurations
-- (needs an interpreter with `debugpy` installed; ~/.venv/debugpy provides it,
--  falls back to `python3` otherwise)
require("dap-python").setup(python_for_dap)

dap.configurations.python = {
    {
        type = 'python';
        request = 'launch';
        name = "Launch file";
        program = "${file}";
        pythonPath = function()
            if vim.fn.executable(debugpy) == 1 then
                return debugpy
            end
            return 'python3'
        end;
        --args = {"--trace", "tests/t2_begins.py"};
    },
}

dapui.setup()

dap.listeners.before.attach.dapui_config = function()
    dapui.open()
end

dap.listeners.before.launch.dapui_config = function()
    dapui.open()
end

dap.listeners.before.event_terminated.dapui_config = function()
    dapui.close()
end

dap.listeners.before.event_exited.dapui_config = function()
    dapui.close()
end

-- Keybindings (debug lives under <leader>x so it doesn't collide with
-- <leader>d = delete-to-blackhole in lua/buba/remap.lua)
vim.keymap.set('n', '<leader>xt', function()
    dapui.toggle()
end, { desc = 'DAP: toggle UI' })
vim.keymap.set('n', '<leader>xc', function() dap.continue() end, { desc = 'DAP: continue/start' })
vim.keymap.set('n', '<leader>xso', function() dap.step_over() end, { desc = 'DAP: step over' })
vim.keymap.set('n', '<leader>xsi', function() dap.step_into() end, { desc = 'DAP: step into' })
vim.keymap.set('n', '<leader>xsu', function() dap.step_out() end, { desc = 'DAP: step out' })
vim.keymap.set('n', '<leader>b', function() dap.toggle_breakpoint() end, { desc = 'DAP: toggle breakpoint' })
vim.keymap.set('n', '<leader>B', function() dap.set_breakpoint() end, { desc = 'DAP: conditional breakpoint' })
vim.keymap.set('n', '<leader>lp', function() dap.set_breakpoint(nil, nil, vim.fn.input('Log point message: ')) end, { desc = 'DAP: set log point' })
vim.keymap.set('n', '<leader>xr', function() dap.repl.open() end, { desc = 'DAP: open REPL' })
vim.keymap.set('n', '<leader>xl', function() dap.run_last() end, { desc = 'DAP: run last' })
vim.keymap.set({'n', 'v'}, '<leader>xh', function()
    require('dap.ui.widgets').hover()
end, { desc = 'DAP: hover' })
vim.keymap.set({'n', 'v'}, '<leader>xp', function()
    require('dap.ui.widgets').preview()
end, { desc = 'DAP: preview' })
vim.keymap.set('n', '<leader>xf', function()
    local widgets = require('dap.ui.widgets')
    widgets.centered_float(widgets.frames)
end, { desc = 'DAP: frames' })
vim.keymap.set('n', '<leader>xs', function()
    local widgets = require('dap.ui.widgets')
    widgets.centered_float(widgets.scopes)
end, { desc = 'DAP: scopes' })

