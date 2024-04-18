export function manhattan(dx, dy){
    return dx + dy;
}

export function euclidian(dx, dy){
    return Math.sqrt(dx * dx + dy * dy);
}

export function octile(dx, dy){
    let F = Math.SQRT2 - 1;
    return (dx < dy) ? F * dx + dy : F * dy + dx;
}

export function chebyshev(dx, dy){
    return Math.max(dx, dy);
}