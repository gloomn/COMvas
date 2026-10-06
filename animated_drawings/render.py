# Copyright (c) Meta Platforms, Inc. and affiliates.
# This source code is licensed under the MIT license found in the
# LICENSE file in the root directory of this source tree.

import logging
import sys


def start(user_mvc_cfg_fn: str, progress_callback=None):
    if progress_callback: progress_callback(10, "애니메이션 환경 설정 중... (Config)")
    # build cfg
    from animated_drawings.config import Config
    cfg: Config = Config(user_mvc_cfg_fn)

    if progress_callback: progress_callback(12, "렌더링 뷰포트 초기화 중... (View)")
    # create view
    from animated_drawings.view.view import View
    view = View.create_view(cfg.view)

    if progress_callback: progress_callback(15, "물리 엔진 및 캐릭터 씬 로드 중... (Scene)")
    # create scene
    from animated_drawings.model.scene import Scene
    scene = Scene(cfg.scene)

    if progress_callback: progress_callback(18, "비디오 렌더러 준비 중... (Controller)")
    # create controller
    from animated_drawings.controller.controller import Controller
    controller = Controller.create_controller(cfg.controller, scene, view)
    
    if progress_callback:
        controller.progress_callback = progress_callback

    # start the run loop
    controller.run()


if __name__ == '__main__':
    logging.basicConfig(filename='log.txt', level=logging.DEBUG)

    # user-specified mvc configuration filepath. Can be absolute, relative to cwd, or relative to ${AD_ROOT_DIR}
    user_mvc_cfg_fn = sys.argv[1]

    start(user_mvc_cfg_fn)
