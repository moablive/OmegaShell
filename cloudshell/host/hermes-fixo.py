"""CloudShell — o chat da aba fixa conselho (26/10/2026, pedido do dono: a aba não fecha nem responde ao /exit).

Roda o hermes como o /usr/local/bin/hermes (mesmo python do venv, mesmo hermes_cli.main), mas antes troca,
só neste processo, o que encerraria o chat: /exit e /quit (com ou sem --delete), Ctrl+D e Ctrl+C/Ctrl+Q com a
linha vazia e o Ctrl+Z (suspender deixaria a aba parada sem shell para o fg). Ctrl+C com o agente rodando
continua interrompendo; se algo ainda derrubar o processo, o painel fixo volta sozinho (pane-died, tmux.conf).
Instalado em /usr/local/lib/cloudshell/ e chamado pelo fixas.sh:
  /usr/local/lib/hermes-agent/venv/bin/python /usr/local/lib/cloudshell/hermes-fixo.py -p conselho-omega chat
"""
import sys

sys.path.insert(0, "/usr/local/lib/hermes-agent")

from hermes_cli.cli_loops_mixin import CLILoopsMixin  # noqa: E402
from hermes_cli.cli_tui_mixin import CLITuiMixin  # noqa: E402

AVISO = "aba fixa do CloudShell: o chat do Conselho não fecha aqui"


def _aviso():
    from cli import _DIM, _RST, _cprint
    _cprint(f"  {_DIM}✗ {AVISO}{_RST}")


def _cmd_exit(self, cmd_original):
    _aviso()
    return True  # True = o REPL continua


def _clear_or_exit(self, event):
    if event.app.current_buffer.text or self._attached_images:
        event.app.current_buffer.reset()
        self._attached_images.clear()
    else:
        _aviso()
    event.app.invalidate()


def _ctrl_d(self, event):
    if event.app.current_buffer.text:
        event.app.current_buffer.delete()
    else:
        _aviso()
        event.app.invalidate()


def _ctrl_z(self, event):
    _aviso()
    event.app.invalidate()


CLILoopsMixin._cmd_exit = _cmd_exit
CLITuiMixin._tui_clear_or_exit = _clear_or_exit
CLITuiMixin._tui_handle_ctrl_d = _ctrl_d
CLITuiMixin._tui_handle_ctrl_z = _ctrl_z

if __name__ == "__main__":
    from hermes_cli.main import main
    main()
