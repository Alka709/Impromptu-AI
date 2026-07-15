"""Shared utility functions for the speech analysis package."""

import functools
import json
import logging
import time
from typing import Any

import numpy as np

logger = logging.getLogger(__name__)


def safe_divide(numerator: float, denominator: float, default: float = 0.0) -> float:
    """Return *numerator / denominator*, falling back to *default* on zero.

    Args:
        numerator: The dividend.
        denominator: The divisor.
        default: Value returned when *denominator* is zero.

    Returns:
        The quotient or *default*.
    """
    if denominator == 0:
        return default
    return numerator / denominator


def round_val(value: float, decimals: int = 2) -> float:
    """Round a numeric value to the given number of decimal places.

    Args:
        value: The number to round.
        decimals: Decimal precision.

    Returns:
        Rounded float.
    """
    return round(float(value), decimals)


def timed(func):
    """Decorator that logs the wall-clock execution time of a function.

    Args:
        func: The callable to wrap.

    Returns:
        Wrapped callable with timing instrumentation.
    """

    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        start = time.perf_counter()
        result = func(*args, **kwargs)
        elapsed = time.perf_counter() - start
        logger.info("%s completed in %.2fs", func.__qualname__, elapsed)
        return result

    return wrapper


class NumpyEncoder(json.JSONEncoder):
    """JSON encoder that handles numpy scalars and arrays."""

    def default(self, o: Any) -> Any:
        if isinstance(o, np.integer):
            return int(o)
        if isinstance(o, np.floating):
            return float(o)
        if isinstance(o, np.ndarray):
            return o.tolist()
        return super().default(o)


def to_json(data: dict[str, Any], indent: int = 2) -> str:
    """Serialise a dict to a JSON string, handling numpy types.

    Args:
        data: Dictionary to serialise.
        indent: JSON indentation level.

    Returns:
        JSON string.
    """
    return json.dumps(data, cls=NumpyEncoder, indent=indent)
