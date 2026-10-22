from pathlib import Path

import matplotlib as mpl
import matplotlib.pyplot as plt
from matplotlib import font_manager
from matplotlib.colors import LinearSegmentedColormap

HERE = Path(__file__).parent
ROOT = HERE.parent.parent
DATA = HERE.parent / "data"
GRAPHS = ROOT / "docs" / "graphs"
FONT = ROOT / "netlify" / "functions" / "fonts" / "sono.ttf"

SURFACE = "#faf3ea"
INK = "#366c94"
INK_DARK = "#1f3f57"
INK_LIGHT = "#b7cddd"
MUTED = "#8a8a8a"
PAPER = "#efe6d8"
RED = "#c0392b"
ORANGE = "#e67e22"
GREEN = "#2e8b57"

INK_CMAP = LinearSegmentedColormap.from_list("ink", [INK_LIGHT, INK, INK_DARK])
HEAT_CMAP = LinearSegmentedColormap.from_list("heat", [INK_LIGHT, INK, RED])

def apply() -> None:
    if FONT.exists():
        font_manager.fontManager.addfont(str(FONT))
        mpl.rcParams["font.family"] = "Sono"

    mpl.rcParams.update(
        {
            "figure.facecolor": SURFACE,
            "axes.facecolor": SURFACE,
            "savefig.facecolor": SURFACE,
            "axes.edgecolor": INK,
            "axes.labelcolor": INK,
            "xtick.color": INK,
            "ytick.color": INK,
            "text.color": INK,
            "axes.spines.top": False,
            "axes.spines.right": False,
            "axes.titleweight": "bold",
            "legend.frameon": False,
            "figure.dpi": 150,
        }
    )

def save(fig, path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fig.savefig(path, bbox_inches="tight")
    plt.close(fig)
    print("wrote", path.relative_to(ROOT))
